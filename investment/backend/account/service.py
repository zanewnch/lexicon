"""
Shioaji account services — portfolio, holdings, trades, settlements, orders, bidask.
"""

import hashlib
import hmac
import json
import logging
import os
import time
from datetime import date, datetime
from threading import Lock

import shioaji as sj
from shioaji.constant import Action, StockPriceType, OrderType, StockOrderLot
from django.db import transaction
from django.utils import timezone

from core.cache import ServiceUnavailable
from core.shioaji import ShioajiConnection
from trading_core.enums import (ExecutionVenue, OrderStatus as LocalOrderStatus,
                                OrderType as LocalOrderType, PositionStatus, Side)
from trading_core.models import Order as LocalOrder, Position
from trading_core.order_refs import make_client_ref

logger = logging.getLogger(__name__)


class AccountService:
    """Shioaji 帳戶資料服務。"""

    def __init__(self):
        self._conn = ShioajiConnection.get_instance()

    @staticmethod
    def _format_order_time(value) -> str:
        if not value:
            return ""
        try:
            order_at = value if isinstance(value, datetime) else datetime.fromisoformat(str(value))
        except ValueError:
            return ""
        if timezone.is_aware(order_at):
            order_at = timezone.localtime(order_at)
        return order_at.strftime("%H:%M:%S")

    @property
    def _api(self):
        try:
            return self._conn.get_api()
        except Exception as e:
            raise ServiceUnavailable("Shioaji 連線失敗") from e

    @property
    def _cache(self):
        return self._conn.cache

    # -- 模擬模式帳務 --------------------------------------------------------
    # Shioaji 模擬環境不保證完整帳務資料：
    #   - account_balance：不支援（會拋出 Warning）
    #   - settlements：不支援
    #   - list_positions：支援，但可能未反映本機已確認的成交
    #   - list_trades：模擬模式可查委託狀態；下單頁需要顯示真實回報。
    # 不支援的餘額、交割等帳務仍維持空資料。
    # 參考：https://sinotrade.github.io/tutor/simulation/

    def _simulation_holdings(self) -> list[dict]:
        """Only broker-confirmed fills create local positions; prices are optional."""
        positions = Position.objects.filter(
            venue=ExecutionVenue.BROKER_SIMULATION,
            status=PositionStatus.OPEN,
            qty__gt=0,
        )
        grouped = {}
        for pos in positions:
            row = grouped.setdefault(pos.symbol, {"shares": 0, "cost": 0.0})
            row["shares"] += pos.qty
            row["cost"] += pos.qty * pos.avg_cost

        if not grouped:
            return []

        try:
            api = self._api
        except ServiceUnavailable:
            api = None

        holdings = []
        for code, row in grouped.items():
            shares = row["shares"]
            cost = row["cost"] / shares
            name, current = code, None
            if api is not None:
                try:
                    contract = api.Contracts.Stocks[code]
                    name = getattr(contract, "name", None) or code
                    snapshots = api.snapshots([contract])
                    close = float(getattr(snapshots[0], "close", 0) or 0) if snapshots else 0
                    current = close if close > 0 else None
                except Exception:
                    logger.warning("Simulation quote unavailable for %s", code)
            pnl = (current - cost) * shares if current is not None else None
            holdings.append({
                "code": code, "name": name, "shares": shares,
                "avgCost": cost, "current": current,
                "pnl": round(pnl) if pnl is not None else None,
                "pnlPercent": round(pnl / row["cost"] * 100, 2) if pnl is not None else None,
                "source": "confirmed_local_fills",
            })
        return holdings

    def get_portfolio_summary(self) -> dict:
        """Fetch account balance, positions, and P&L."""
        if self._conn.simulation_mode:
            holdings = self._simulation_holdings()
            total_cost = sum(h["avgCost"] * h["shares"] for h in holdings)
            valuation_complete = all(h["current"] is not None for h in holdings)
            total_value = sum(h["current"] * h["shares"] for h in holdings) if valuation_complete else None
            unrealized_pnl = total_value - total_cost if total_value is not None else None
            return {
                "totalValue": round(total_value) if total_value is not None else None,
                "totalCost": round(total_cost),
                "totalAssets": None,  # 模擬環境沒有可靠現金餘額
                "todayPnl": None, "todayPercent": None,
                "unrealizedPnl": round(unrealized_pnl) if unrealized_pnl is not None else None,
                "unrealizedPercent": round(unrealized_pnl / total_cost * 100, 2)
                if unrealized_pnl is not None and total_cost else None,
                "accBalance": None,
                "simulation": True,
                "valuationComplete": valuation_complete,
                "holdingsSource": "confirmed_local_fills",
            }

        cached = self._cache.get("portfolio_summary")
        if cached is not None:
            return cached

        api = self._api

        try:
            balance = api.account_balance(api.stock_account)
            acc_balance = float(balance.acc_balance) if balance else 0

            positions = api.list_positions(api.stock_account)
            total_cost = 0.0
            unrealized_pnl = 0.0
            for pos in positions:
                total_cost += pos.price * pos.quantity * 1000
                unrealized_pnl += pos.pnl

            total_value = total_cost + unrealized_pnl
            unrealized_pct = (unrealized_pnl / total_cost * 100) if total_cost else 0

            today = date.today().isoformat()
            try:
                realized = api.list_profit_loss(api.stock_account, today, today)
                today_pnl = sum(r.pnl for r in realized)
            except Exception:
                logger.warning("list_profit_loss failed, defaulting to 0")
                today_pnl = 0

            today_pct = (today_pnl / total_value * 100) if total_value else 0

            result = {
                "totalValue": round(total_value),
                "totalCost": round(total_cost),
                "totalAssets": round(total_value + acc_balance),
                "todayPnl": round(today_pnl),
                "todayPercent": round(today_pct, 2),
                "unrealizedPnl": round(unrealized_pnl),
                "unrealizedPercent": round(unrealized_pct, 2),
                "accBalance": round(acc_balance),
            }

            self._cache.set("portfolio_summary", result)
            return result

        except ServiceUnavailable:
            raise
        except Exception as e:
            logger.exception("get_portfolio_summary 失敗")
            raise ServiceUnavailable("取得投資組合摘要失敗") from e

    def get_holdings(self) -> list[dict]:
        """Fetch current stock holdings."""
        if self._conn.simulation_mode:
            return self._simulation_holdings()

        cached = self._cache.get("holdings")
        if cached is not None:
            return cached

        api = self._api

        try:
            positions = api.list_positions(api.stock_account)
            holdings = []
            for pos in positions:
                shares = pos.quantity * 1000
                cost = pos.price
                current = pos.last_price
                pnl = pos.pnl
                pnl_pct = (pnl / (cost * shares) * 100) if cost and shares else 0

                name = pos.code
                try:
                    contract = api.Contracts.Stocks[pos.code]
                    if contract:
                        name = contract.name
                except (KeyError, AttributeError):
                    pass

                holdings.append({
                    "code": pos.code,
                    "name": name,
                    "shares": shares,
                    "avgCost": cost,
                    "current": current,
                    "pnl": round(pnl),
                    "pnlPercent": round(pnl_pct, 2),
                })

            self._cache.set("holdings", holdings)
            return holdings

        except ServiceUnavailable:
            raise
        except Exception as e:
            logger.exception("get_holdings 失敗")
            raise ServiceUnavailable("取得持股資料失敗") from e

    def get_recent_trades(self) -> list[dict]:
        """Fetch today's trades."""
        cached = self._cache.get("recent_trades")
        if cached is not None:
            return cached

        api = self._api

        try:
            api.update_status(api.stock_account)
            trades = api.list_trades()
            stock_account = api.stock_account
            results = []
            for t in trades:
                order_account = getattr(t.order, "account", None)
                if (getattr(order_account, "account_id", None) != stock_account.account_id
                        or getattr(order_account, "broker_id", None) != stock_account.broker_id):
                    continue
                code = t.contract.code if t.contract else ""
                name = code
                try:
                    contract = api.Contracts.Stocks[code]
                    if contract:
                        name = contract.name
                except (KeyError, AttributeError):
                    pass

                action = getattr(t.order, "action", "")
                side = "buy" if getattr(action, "name", action) == "Buy" else "sell"

                status_map = {
                    "Filled": "已成交",
                    "PartFilled": "部分成交",
                    "Cancelled": "已取消",
                    "Failed": "失敗",
                    "Submitted": "委託中",
                    "PreSubmitted": "預約中",
                    "PendingSubmit": "送出中",
                }
                raw_status = getattr(t.status, "status", str(t.status)) if hasattr(t, "status") else ""
                raw_status = getattr(raw_status, "name", raw_status)
                status = status_map.get(raw_status, raw_status)

                deals = getattr(t.status, "deals", []) or []
                filled_shares = sum(int(d.quantity) for d in deals) * 1000
                price = (
                    sum(float(d.price) * int(d.quantity) for d in deals)
                    / sum(int(d.quantity) for d in deals)
                    if deals else float(getattr(t.order, "price", 0))
                )
                shares = int(getattr(t.order, "quantity", 0)) * 1000
                amount = price * filled_shares
                fee, tax = _compute_tw_stock_fee_tax(amount, side)
                price_type = getattr(t.order, "price_type", "")
                price_type = getattr(price_type, "value", price_type)

                results.append({
                    "orderId": str(getattr(t.order, "id", "") or ""),
                    "time": self._format_order_time(getattr(t.status, "order_datetime", None)),
                    "code": code,
                    "name": name,
                    "side": side,
                    "orderType": "市價" if price_type in ("MKT", "MKP") else "限價",
                    "price": price,
                    "shares": shares,
                    "filledShares": filled_shares,
                    "amount": round(amount),
                    "fee": fee,
                    "tax": tax,
                    "status": status or "委託中",
                    "cancelable": raw_status in ("Submitted", "PreSubmitted", "PartFilled")
                    and bool(getattr(t.order, "id", "")),
                })

            results.reverse()
            self._cache.set("recent_trades", results)
            return results

        except ServiceUnavailable:
            raise
        except Exception as e:
            logger.exception("get_recent_trades 失敗")
            raise ServiceUnavailable("取得交易紀錄失敗") from e

    def get_settlements(self) -> list[dict]:
        """Fetch upcoming settlement amounts."""
        if self._conn.simulation_mode:
            return []

        cached = self._cache.get("settlements")
        if cached is not None:
            return cached

        try:
            api = self._api
            settlements = api.settlements(api.stock_account)
            result = [
                {
                    "date": str(s.date),
                    "amount": s.amount,
                    "t": s.T,
                }
                for s in settlements
            ]
            self._cache.set("settlements", result)
            return result
        except ServiceUnavailable:
            raise
        except Exception as e:
            raise ServiceUnavailable("取得交割資料失敗") from e

    # ------------------------------------------------------------------
    # Place order (with safety checks)
    # ------------------------------------------------------------------

    # 防護設定
    MAX_SINGLE_ORDER_AMOUNT = 5_000_000   # 單筆上限 500 萬
    MAX_SHARES_PER_ORDER = 50_000         # 單筆最多 50 張 (50000 股)
    PRICE_DEVIATION_LIMIT = 0.07          # 委託價偏離市價 7% 以上拒絕
    ORDER_COOLDOWN_SECONDS = 3            # 兩筆委託最少間隔 3 秒
    MAX_DAILY_ORDERS = 50                 # 每日最多 50 筆委託

    _order_lock = Lock()
    _last_order_time: float = 0
    _daily_order_count: int = 0
    _daily_order_date: str = ""
    _recent_order_hashes: list[tuple[str, float]] = []

    def prepare_order(self, trade_pin: str, expected_venue: str, *, new_order: bool = True):
        """Check broker access before any order is created or submitted."""
        if expected_venue not in (
            ExecutionVenue.BROKER_SIMULATION, ExecutionVenue.BROKER_PRODUCTION,
        ):
            raise ValueError("請明確指定券商模擬或正式交易環境")
        if not trade_pin or not self._verify_trade_pin(trade_pin):
            raise ValueError("交易密碼未設定或錯誤")
        api = self._api
        if self._conn.simulation_mode:
            venue = ExecutionVenue.BROKER_SIMULATION
        else:
            if new_order and os.environ.get("SHIOAJI_ENABLE_LIVE_TRADING") != "true":
                raise ServiceUnavailable("正式下單未啟用；須明確設定 SHIOAJI_ENABLE_LIVE_TRADING=true")
            if getattr(api.stock_account, "signed", None) is not True:
                raise ServiceUnavailable("股票帳戶未確認完成 API 簽署，禁止正式下單")
            venue = ExecutionVenue.BROKER_PRODUCTION
        if venue != expected_venue:
            raise ValueError("券商環境與本次委託指定的環境不符，已停止下單")
        from trading_core.fill_handler import FillHandler
        FillHandler.register(api, venue)
        if new_order:
            try:
                api.update_status(api.stock_account)
                health = api.trade_cache_health(api.stock_account)
                state = FillHandler._enum_value(getattr(health, 'state', None))
                reasons = {
                    FillHandler._enum_value(getattr(reason, 'reason', None))
                    for reason in (getattr(health, 'reasons', None) or [])
                }
                if not ((state == 'Healthy' and not reasons)
                        or (state == 'Unknown' and reasons == {'NoBaseline'})):
                    raise ServiceUnavailable('券商委託回報狀態異常，請先查詢並對帳')
            except ServiceUnavailable:
                raise
            except Exception as e:
                raise ServiceUnavailable('券商委託狀態無法確認，禁止送出新委託') from e
        return api, venue

    def cancel_order(self, payload: dict) -> dict:
        """Submit a cancellation for one identified stock order on this account."""
        order_id = str(payload.get("order_id") or "").strip()
        if not order_id:
            raise ValueError("缺少券商委託編號")
        api, venue = self.prepare_order(
            str(payload.get("trade_pin") or ""),
            payload.get("expected_venue", ""),
            new_order=False,
        )
        api.update_status(api.stock_account)
        stock_account = api.stock_account
        trade = next((t for t in api.list_trades()
                      if str(getattr(t.order, "id", "") or "") == order_id
                      and getattr(getattr(t.order, "account", None), "account_id", None) == stock_account.account_id
                      and getattr(getattr(t.order, "account", None), "broker_id", None) == stock_account.broker_id), None)
        if trade is None:
            raise ValueError("找不到此股票帳戶的委託")
        status = getattr(trade.status, "status", None)
        status_name = getattr(status, "name", status)
        if status_name not in ("Submitted", "PreSubmitted", "PartFilled"):
            raise ValueError("目前委託狀態不允許取消")
        try:
            api.cancel_order(trade)
        except Exception as e:
            logger.exception("cancel_order 失敗")
            raise ServiceUnavailable("券商取消結果未確認，請查詢委託狀態後再操作") from e
        self._cache.clear()
        return {"order_id": order_id, "venue": venue, "message": "取消請求已送出，請重新查詢券商狀態"}

    def place_order(self, payload: dict) -> dict:
        """Place a stock order via Shioaji with comprehensive safety checks.

        payload keys:
            code:       str   — stock code, e.g. "2330"
            side:       str   — "buy" or "sell"
            price:      float — order price (ignored if type is "market")
            shares:     int   — number of shares (must be multiples of 1000)
            type:       str   — "limit" or "market"
            trade_pin:  str   — trading PIN for confirmation
        """
        # ---- 1. 基本欄位驗證 ----
        code = payload.get("code", "").strip()
        side = payload.get("side", "")
        price = float(payload.get("price", 0))
        shares = int(payload.get("shares", 0))
        order_type_str = payload.get("type", "limit").lower()
        trade_pin = payload.get("trade_pin", "")

        if not code:
            raise ValueError("缺少股票代碼")
        if side not in ("buy", "sell"):
            raise ValueError("無效的交易方向，僅接受 buy 或 sell")
        if order_type_str not in ("limit", "market"):
            raise ValueError("無效的委託類型，僅接受 limit 或 market")
        if shares <= 0:
            raise ValueError("股數必須大於 0")
        if shares % 1000 != 0:
            raise ValueError("股數須為 1000 的倍數（整張交易）")
        if shares > self.MAX_SHARES_PER_ORDER:
            raise ValueError(f"單筆委託上限 {self.MAX_SHARES_PER_ORDER // 1000} 張")

        # ---- 2. 交易密碼驗證 ----
        api, venue = self.prepare_order(trade_pin, payload.get("expected_venue", ""))
        client_ref = payload.get("client_ref") or ""
        if client_ref and (
            not isinstance(client_ref, str) or len(client_ref) > 6
            or not client_ref.isascii() or not client_ref.isalnum()
        ):
            raise ValueError("無效的委託識別碼")
        if client_ref:
            tracked = LocalOrder.objects.filter(client_ref=client_ref).first()
            if (tracked is None or tracked.venue != venue or tracked.symbol != code
                    or tracked.side != side or tracked.qty != shares
                    or tracked.order_type != order_type_str
                    or tracked.status != LocalOrderStatus.PENDING):
                raise ValueError("委託識別碼與本機待送出委託不符")

        # ---- 3. 合約存在性 ----
        try:
            contract = api.Contracts.Stocks[code]
        except (KeyError, AttributeError) as e:
            raise ValueError(f"找不到股票 {code}") from e

        # ---- 4. 價格驗證（限價單）----
        if order_type_str == "limit":
            if price <= 0:
                raise ValueError("限價單價格必須大於 0")

            # 檢查 tick size 合法性
            tick = _get_tick_size(price)
            remainder = round(price % tick, 4)
            if remainder > 0.0001 and abs(remainder - tick) > 0.0001:
                raise ValueError(f"價格 {price} 不符合最小跳動單位 {tick}")

            # 漲跌停檢查
            limit_up = float(getattr(contract, "limit_up", 0))
            limit_down = float(getattr(contract, "limit_down", 0))
            if limit_up and price > limit_up:
                raise ValueError(f"委託價 {price} 超過漲停價 {limit_up}")
            if limit_down and price < limit_down:
                raise ValueError(f"委託價 {price} 低於跌停價 {limit_down}")

            # 偏離市價檢查
            try:
                snaps = api.snapshots([contract])
                if snaps and snaps[0].close:
                    market_price = float(snaps[0].close)
                    if market_price > 0:
                        deviation = abs(price - market_price) / market_price
                        if deviation > self.PRICE_DEVIATION_LIMIT:
                            raise ValueError(
                                f"委託價 {price} 偏離市價 {market_price:.2f} 達 "
                                f"{deviation * 100:.1f}%（上限 {self.PRICE_DEVIATION_LIMIT * 100:.0f}%）"
                            )
            except ValueError:
                raise
            except Exception:
                logger.warning("Snapshot check failed for %s, proceeding without deviation check", code)

        # ---- 5. 金額上限 ----
        order_price = price if order_type_str == "limit" else 0
        if order_type_str == "market":
            ceiling = float(getattr(contract, "limit_up", 0) or 0)
            if ceiling <= 0:
                raise ValueError("無法取得漲停價，禁止市價委託")
            estimated_amount = ceiling * shares
        else:
            estimated_amount = price * shares
        if estimated_amount > self.MAX_SINGLE_ORDER_AMOUNT:
            raise ValueError(
                f"預估金額 ${estimated_amount:,.0f} 超過單筆上限 "
                f"${self.MAX_SINGLE_ORDER_AMOUNT:,.0f}"
            )

        cls = type(self)
        with cls._order_lock:
            # ---- 6. 防連點 / 頻率限制 ----
            now = time.time()
            if now - cls._last_order_time < self.ORDER_COOLDOWN_SECONDS:
                raise ValueError(
                    f"操作過快，請等待 {self.ORDER_COOLDOWN_SECONDS} 秒後再下單"
                )

            # ---- 7. 每日委託次數限制 ----
            today = date.today().isoformat()
            if cls._daily_order_date != today:
                cls._daily_order_count = 0
                cls._daily_order_date = today
            if cls._daily_order_count >= self.MAX_DAILY_ORDERS:
                raise ValueError(f"今日委託已達上限 {self.MAX_DAILY_ORDERS} 筆")

            # ---- 8. 防重複委託（相同參數 10 秒內）----
            order_hash = hashlib.md5(
                f"{code}:{side}:{price}:{shares}:{order_type_str}".encode()
            ).hexdigest()
            cls._recent_order_hashes = [
                (h, t) for h, t in cls._recent_order_hashes if now - t < 10
            ]
            for h, _ in cls._recent_order_hashes:
                if h == order_hash:
                    raise ValueError("偵測到重複委託（相同股票、方向、價格、股數），已攔截")
            # ---- 9. 送出委託 ----
            action = Action.Buy if side == "buy" else Action.Sell

            if order_type_str == "market":
                price_type = StockPriceType.MKT
                order_price = 0
            else:
                price_type = StockPriceType.LMT
                order_price = price

            quantity = shares // 1000

            direct_order = None
            if not client_ref:
                with transaction.atomic():
                    position = None
                    if side == Side.SELL:
                        positions = list(Position.objects.select_for_update().filter(
                            symbol=code, venue=venue, status=PositionStatus.OPEN,
                            qty__gte=shares,
                        ).order_by('opened_at')[:2])
                        if len(positions) != 1:
                            raise ValueError("賣出須對應一筆足額的本機持倉；請使用出場管理逐筆賣出")
                        position = positions[0]
                        if LocalOrder.objects.filter(
                            position=position, side=Side.SELL,
                            status__in=[LocalOrderStatus.PENDING, LocalOrderStatus.SUBMITTED,
                                        LocalOrderStatus.PARTIALLY_FILLED],
                        ).exists():
                            raise ValueError("此持倉已有未完成賣單")
                    elif LocalOrder.objects.filter(
                        symbol=code, side=Side.BUY, venue=venue,
                        status=LocalOrderStatus.PENDING,
                    ).exists():
                        raise ValueError("此股票有結果未確認的買單，請先對帳")

                    direct_order = LocalOrder.objects.create(
                        symbol=code, side=side, qty=shares,
                        order_type=(LocalOrderType.MARKET if order_type_str == 'market'
                                    else LocalOrderType.LIMIT),
                        price=price if order_type_str == 'limit' else None,
                        status=LocalOrderStatus.PENDING, venue=venue, position=position,
                        note='direct broker order awaiting submission',
                    )
                    client_ref = make_client_ref(direct_order.pk)
                    direct_order.client_ref = client_ref
                    direct_order.save(update_fields=['client_ref'])

            cls._recent_order_hashes.append((order_hash, now))

            order = api.Order(
                price=order_price,
                quantity=quantity,
                action=action,
                price_type=price_type,
                order_type=OrderType.ROD,
                order_lot=StockOrderLot.Common,
                account=api.stock_account,
                custom_field=client_ref,
            )

            try:
                trade = api.place_order(contract, order)
                broker_id = str(getattr(trade.status, "id", "") or "") if trade.status else ""
                if direct_order:
                    current = LocalOrder.objects.get(pk=direct_order.pk)
                    if current.external_id and current.external_id != broker_id:
                        raise RuntimeError('broker order ID conflicts with callback')
                    if broker_id and not current.external_id:
                        LocalOrder.objects.filter(pk=direct_order.pk, external_id='').update(
                            external_id=broker_id,
                        )
                    if broker_id:
                        LocalOrder.objects.filter(pk=direct_order.pk,
                                                  status=LocalOrderStatus.PENDING).update(
                            status=LocalOrderStatus.SUBMITTED,
                            note='direct broker order submitted',
                        )
                cls._last_order_time = now
                cls._daily_order_count += 1
                self._cache.clear()

                if not broker_id:
                    raise ServiceUnavailable("券商委託編號尚未確認，請先對帳")

                logger.info(
                    "ORDER PLACED: %s %s %s @ %s x %d shares (order_id=%s)",
                    side.upper(), code, order_type_str,
                    order_price, shares,
                    broker_id,
                )

                return {
                    "success": True,
                    "order_id": broker_id,
                    "code": code,
                    "side": side,
                    "price": order_price,
                    "shares": shares,
                    "venue": venue,
                    "message": "委託已送出",
                }
            except Exception as e:
                logger.exception("place_order 失敗")
                raise ServiceUnavailable("券商委託結果未確認，請查詢委託狀態後再操作") from e

    def _verify_trade_pin(self, pin: str) -> bool:
        """Require a configured PIN before any broker order, including simulation."""
        from core.shioaji import _CREDENTIALS_PATH

        try:
            stored_pin = os.environ.get("SHIOAJI_TRADE_PIN", "")
            if not stored_pin and _CREDENTIALS_PATH.is_file():
                with open(_CREDENTIALS_PATH, encoding="utf-8") as f:
                    stored_pin = json.load(f).get("trade_pin", "")
            if not stored_pin:
                logger.warning("Broker order blocked: trade PIN is not configured")
                return False
            return hmac.compare_digest(pin, stored_pin)
        except (OSError, json.JSONDecodeError, TypeError):
            logger.warning("Broker order blocked: trade PIN configuration is unreadable")
            return False

    # ------------------------------------------------------------------
    # BidAsk (snapshot best bid/ask)
    # ------------------------------------------------------------------

    def get_bidask(self, code: str) -> dict:
        """Fetch the snapshot's best bid and ask; depth comes from streaming."""
        cache_key = f"bidask_{code}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        api = self._api

        try:
            contract = api.Contracts.Stocks[code]
        except (KeyError, AttributeError):
            return {"asks": [], "bids": []}

        try:
            snaps = api.snapshots([contract])
            if not snaps:
                return {"asks": [], "bids": []}
            snap = snaps[0]

            sell_price = float(getattr(snap, "sell_price", 0) or 0)
            buy_price = float(getattr(snap, "buy_price", 0) or 0)
            asks = ([{"price": sell_price, "volume": int(getattr(snap, "sell_volume", 0) or 0)}]
                    if sell_price > 0 else [])
            bids = ([{"price": buy_price, "volume": int(getattr(snap, "buy_volume", 0) or 0)}]
                    if buy_price > 0 else [])

            result = {"asks": asks, "bids": bids}
            self._cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.warning("get_bidask failed for %s: %s", code, e)
            return {"asks": [], "bids": []}

    # ------------------------------------------------------------------
    # Limit prices (漲跌停)
    # ------------------------------------------------------------------

    def get_limit_prices(self, code: str) -> dict:
        """Fetch limit up/down prices for a stock."""
        cache_key = f"limit_prices_{code}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        api = self._api

        try:
            contract = api.Contracts.Stocks[code]
        except (KeyError, AttributeError):
            return {"limitUp": 0, "limitDown": 0}

        try:
            limit_up = float(getattr(contract, "limit_up", 0))
            limit_down = float(getattr(contract, "limit_down", 0))

            # Fallback: calculate from reference price
            if not limit_up or not limit_down:
                snaps = api.snapshots([contract])
                if snaps:
                    snap = snaps[0]
                    ref = snap.close - snap.change_price if snap.close and snap.change_price else snap.close
                    if ref and ref > 0:
                        limit_up = round(ref * 1.10, 2)
                        limit_down = round(ref * 0.90, 2)

            result = {"limitUp": limit_up, "limitDown": limit_down}
            self._cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.warning("get_limit_prices failed for %s: %s", code, e)
            return {"limitUp": 0, "limitDown": 0}


def _compute_tw_stock_fee_tax(amount: float, side: str) -> tuple[int, int]:
    """Estimate TW stock brokerage fee and transaction tax.

    Fee: 0.1425% of amount, minimum NT$20 (buyer and seller both pay).
    Tax: 0.3% of amount, seller only (normal shares; ETF is 0.1%, day-trade 0.15%,
    not detectable here — use the normal-share rate as a conservative upper bound).
    """
    if amount <= 0:
        return 0, 0
    fee = max(round(amount * 0.001425), 20)
    tax = round(amount * 0.003) if side == "sell" else 0
    return fee, tax


def _get_tick_size(price: float) -> float:
    """TWSE tick size table."""
    if price < 10:
        return 0.01
    if price < 50:
        return 0.05
    if price < 100:
        return 0.1
    if price < 500:
        return 0.5
    if price < 1000:
        return 1.0
    return 5.0
