# 交易 Pipeline 架構

將「一筆交易的完整生命週期」拆成五個獨立模組，對應業界量化平台（Zipline、Backtrader、QuantConnect）的標準分法。

```
Scanner → Trader → Watchdog → Exiter → Bookkeeper
  選股     進場      監控        出場      復盤
```

每個階段都是獨立的金融決策點，語意不重疊。

## 為什麼這樣切分

- **符合交易員工作流程**：早盤研究 → 開盤下單 → 盤中盯盤 → 出場 → 收盤檢討。
- **單一職責**：每個模組可獨立測試、替換策略邏輯。
- **對應業界標準**：這是 CFA 教科書與主流回測框架的切法。
- **擴展性好**：加新策略 / 新資產類別 / 新市場都不動骨架。

## Django App 拆分（5 + 1）

| App | 職責 |
|-----|------|
| `trading_core` | 共用層：5 個 Model（資料契約）、Enum、FillHandler |
| `scanner` | 選股階段 — 產出 Candidate |
| `trader` | 進場階段 — 產出 Order + Position |
| `watchdog` | 監控階段 — 產出 ExitSignal（純觀察，不下單） |
| `exiter` | 出場階段 — 消化 ExitSignal，產出 Order + Trade |
| `bookkeeper` | 復盤階段 — 聚合 Trade 產出績效報表 |
| `risk_guard` | **橫切模組** — 進場前檢查部位上限、單日虧損、黑名單 |

**為什麼需要 `trading_core`**：Position 同時被 Trader（建立）、Watchdog（讀）、Exiter（更新）三方使用，放任一 app 都會造成跨 app 循環 import。集中放 `trading_core` 最乾淨。

## 金融維度（實作時要意識到，雖然 V1 簡化）

### 1. Position Sizing（部位規模） ≠ Entry（進場）

金融上這是兩個獨立決策：
- 「買哪一檔」（Scanner）
- 「何時買、什麼價位」（Trader 進場）
- **「買多少」（Position Sizing）** — 凱利、固定比例、波動度調整、風險平價

V1 採等權重（capital / N），未來要換凱利公式或風險平價時可單獨抽出。

### 2. Risk Management 是橫切維度，不是某階段

三層風控：
- **單筆風險**：停損點、單筆最大虧損 → Watchdog/Exiter
- **投組風險**：總曝險、行業集中度、相關性 → **橫切（RiskGuard）**
- **系統風險**：流動性、黑天鵝 → 未實作

### 3. Signal（訊號） vs Execution（執行）

金融上是兩件事：
- 訊號：「該不該買/賣」（策略邏輯）
- 執行：「怎麼買/賣」（市價、限價、TWAP、VWAP、分批）

V1 混在一起 OK，但 Trader/Exiter 內部要分清楚，未來才好接 TWAP。

### 4. Watchdog vs Exiter 邊界

- **Watchdog 只負責「觀察與發訊號」**：價格觸停損、達目標、形態破壞 → 發 `ExitSignal`
- **Exiter 負責「決策與執行」**：收到訊號，決定一次清倉、分批、追價

這樣 Watchdog 純粹、可重用；Exiter 才能換不同出場演算法。

## 資料契約（5 個 Model）

定義在 `backend/trading_core/models.py`，這 5 個 Model 就是模組間的資料契約。只要契約穩定，各階段內部怎麼實作都不影響其他階段。

```
Candidate
  symbol / score / meta / created_at / consumed
  ↓ Scanner → Trader

Order
  symbol / side / qty / order_type / price / status
  external_id（券商 id）/ filled_at / note
  ↓ Trader & Exiter → 券商

Position
  symbol / qty / avg_cost / status / opened_at / closed_at
  entry_order (FK Order)
  ↑ 持倉狀態，Watchdog 讀、Exiter 關

ExitSignal
  position (FK Position) / reason / triggered_price / triggered_at / processed
  ↓ Watchdog → Exiter

Trade
  symbol / side / qty / price / executed_at / pnl / order (FK Order)
  ↓ 成交紀錄，Bookkeeper 讀
```

### 狀態機

```
Candidate.consumed:  false → true      (Trader 吃單)
Order.status:        PENDING → SUBMITTED → FILLED  (live mode)
                              ↘ CANCELLED / FAILED
Position.status:     OPEN → CLOSED     (Exiter 平倉)
ExitSignal.processed: false → true     (Exiter 處理完)
```

## Pipeline 流程

```
盤前：Scanner.run()                    → Candidate[]
開盤：Trader.execute(capital, prices)  → Order[] + Position[]
盤中：Watchdog.check()  ← (loop)       → ExitSignal[]
即時：Exiter.execute()                 → Order[] + Trade[] + 平倉 Position
盤後：Bookkeeper.get_report()          → 績效報表
```

### 三種紀錄環境

Trader 與 Exiter 同時支援：
- **Paper mode（預設）**：立即創建 Order/Position/Trade 為已成交，不呼叫券商。
- **券商模擬與正式（`live=true` + `tradePin` + `expectedVenue`）**：
  1. 檢查 PIN、指定環境是否與實際連線一致；正式委託另檢查環境開關與股票帳戶簽署狀態。
  2. 先建立帶 `client_ref` 的本機待送出 Order，再呼叫 Shioaji。券商回呼可在送單回傳前依 `client_ref` 找到本機單。
  3. 券商確認 deal 前，不建立買進持倉，也不認列賣出損益；部分成交逐筆入帳。
  4. 收到取消或拒絕回報時更新 Order，仍保留已確認的部分成交。
  5. 券商回呼中斷後，使用 `reconcile_broker_orders` 讀取當日委託與 deal 補帳。

## RiskGuard — 橫切風控

`risk_guard.RiskGuardService.check_entry(symbol, qty, price, capital)` 在 Trader 進場前被呼叫，四條規則：

| 規則 | 欄位 | 預設 |
|---|---|---|
| 黑名單 | `blacklist: [str]` | `[]` |
| 最大同時持倉數 | `max_positions` | 5 |
| 單筆部位佔資金比 | `max_position_pct` | 25% |
| 單日實現虧損上限 | `max_daily_loss` | -50000 |

RiskConfig 採 singleton（pk=1），透過 `/api/risk/config/` PUT 調整。

## Shioaji 成交回呼（FillHandler）

券商委託送出前由同一個 API 進程註冊回呼：

1. `AccountService.prepare_order()` 對當前 API 物件註冊 `FillHandler._raw_callback`。
2. Shioaji `StockDeal` 回呼以 `trade_id` 或 `custom_field` 找本機 Order，以 `exchange_seq` 去重。
3. `Order.filled_qty` 與均價累加；部分成交標為 `PARTIALLY_FILLED`，全部成交才標為 `FILLED`。
4. 買進 deal 建立／增加 Position；賣出 deal 扣減 Position 並寫入實現損益，數量歸零才關閉。
5. `StockOrder` 取消／拒絕回報更新剩餘單狀態；必要時重新開放出場訊號。

## Watchdog 背景服務

```bash
python manage.py watchdog_loop --interval 10 [--stop-loss -5] [--take-profit 10]
```

- 每 N 秒輪詢所有 open Position
- 透過 `QuoteService.snapshots` 拉即時報價
- 觸發停損/停利 → 寫 ExitSignal
- SIGINT/SIGTERM graceful shutdown

## API 端點

基礎路徑：`/api/`

| 端點 | Method | 說明 |
|---|---|---|
| `scanner/run/` | POST | `{ symbols: [] }` 或 `{ funnel: { codes, filters, topN, minScore } }` |
| `scanner/candidates/` | GET | `?all=1` 顯示已採用 |
| `trader/execute/` | POST | `{ capital, prices, live?, tradePin?, expectedVenue? }` |
| `trader/positions/` | GET | `?venue=paper|broker_simulation|broker_production&all=1` |
| `watchdog/check/` | POST | `{ prices?, stopLossPct?, takeProfitPct?, venue? }`（prices 省略時自動拉價） |
| `watchdog/exit-signals/` | GET | `?venue=...&all=1` |
| `exiter/execute/` | POST | `{ live?, tradePin?, expectedVenue? }` |
| `bookkeeper/report/` | GET | Sharpe / Sortino / Max DD / Calmar / Profit Factor / 權益曲線 |
| `bookkeeper/trades/` | GET | `?limit=N` |
| `risk/config/` | GET/PUT | PUT 須提供 `tradePin` 才能調整風控限額 |
| `risk/stats/` | GET | `?venue=...` 查詢同環境持倉與今日實現 PnL |

## Management Commands

| 命令 | 所在 app | 說明 |
|---|---|---|
| `python manage.py watchdog_loop --interval 10 [--venue paper]` | `watchdog` | 指定環境背景監控持倉，預設紙上交易 |
| `python manage.py reconcile_broker_orders` | `trader` | 讀取券商當日股票委託，補入已確認成交；不送單 |
| `python manage.py activate_broker_callback` | `trader` | 舊命令相容入口，提示後執行對帳；API 進程會在送單前註冊回呼 |
| `python manage.py rebuild_tags [--top 500] [--symbols 2330 ...]` | `screener` | 夜間批次算技術標籤 → `StockTrendTag`（配合 `/analysis/tags` 使用） |
| `python manage.py seed_glossary` | `screener` | 初始化術語 → `GlossaryTerm` |

## 前端

交易 Pipeline 在前端有兩套 UI，共用同一份後端 API：

### 五個分離頁（主要）

| 頁面 | 路由 | 說明 |
|------|------|------|
| Trader 進場 | `/trading/trader` | 整合 Pipeline `/pipeline/pending/` 候選清單 + 單檔下單表單 + 批次等權分配面板（自動從 `/watchlist/` 預抓現價） |
| Watchdog 監控 | `/trading/watchdog` | **純監控**：持倉現價、漲跌 %、距停損停利距離條、風險標籤；不觸發檢查、不平倉 |
| Watchdog Pipeline | `/trading/watchdog/pipeline` | 五階段 TabBar 單頁整合（Scanner/Trader/Watchdog/Exiter/Bookkeeper 在同一頁切換） |
| Exiter 出場 | `/trading/exiter` | 停損停利設定、執行 Watchdog 檢查、一鍵平倉、歷史出場紀錄 |
| Bookkeeper 復盤 | `/trading/bookkeeper`、`/trading/bookkeeper/report` | 交易紀錄（含 fee/tax）+ 完整績效報表（Sharpe/Sortino/Max DD/Calmar/PF/權益曲線） |

### 選股 Pipeline（進場前的候選產生）

- 路由 `/analysis/pipeline/step1~4 + confirm`
- 狀態 `stores/pipelineStore.ts`
- commit 後寫入 `Candidate` table，供 `/trading/trader` 的批次下單面板消化

### Types & Composables

- **Types**: `frontend/src/types/trading.ts`
- **主 composable**: `frontend/src/features/trade/composables/useTradingData.ts`（包 5 個 run* 方法 + refreshAll）
- **監控專用**: `frontend/src/features/trade/composables/useWatchdogMonitor.ts`（合併 positions / quotes / exit-signals）
- **帳冊**: `frontend/src/features/bookkeeper/composables/useHistoryData.ts`

實單模式開關為紅色按鈕 + `confirm()` 二次確認 + 密碼欄（Trade PIN）。

## 開發順序（V1 實作時的風險梯度）

本次照「低風險 → 高風險」順序實作：

1. 五個 App 骨架 + 5 個資料契約 → 紙上交易 pipeline 跑通
2. Scanner 接 FunnelService（純讀）
3. Watchdog 自動拉 QuoteService 報價（純讀）
4. 前端 `/trading` 五 tab
5. Trader/Exiter 加 live 下單模式（危險，帶 2 次確認）
6. Bookkeeper 風險指標（純數學）
7. RiskGuard 橫切模組（新增、查詢）
8. Watchdog 背景 loop（長駐程序）
9. FillHandler 成交回呼（真錢 reconciliation）

每階段都可獨立驗證，不會一次把現有系統打掉。

## 未來擴充點

短期：
- 前端 `/risk` 頁面（目前需 API PUT 調整）
- 盤中自動排程（Scanner → Trader → Watchdog → Bookkeeper）
- 通知層（成交、停損觸發 → Telegram/WebSocket）

中期：
- 多策略並行（每策略獨立 pipeline + RiskConfig）
- Position Sizing 獨立（凱利公式、波動度調整）
- Signal vs Execution 拆開（Exiter 接 TWAP / 分批）
- Backtest Harness（同套程式跑歷史 = live/backtest 同構）

長期：
- 績效歸因（賺/虧來自選股 vs 擇時 vs sizing）
- 策略衰退偵測
- 多市場（美股、港股）DataFeed 抽象層
