# 資料流

## 1. HTTP API 報價流程

```
Vue composable（如 features/market/composables/useMarketData.ts）
  → api.get('/stocks/<code>/')    # axios baseURL 已設 /api
    → Django StockDetailView.get()
      → QuoteService.get_stock_detail(code)
        → ShioajiConnection.get_api()
          → api.snapshots([contract])
        → CacheManager（TTL 60s）
      ← Response(data)
    ← axios response
  ← ref() 更新 → 頁面渲染
```

## 2. WebSocket 即時串流

```
Vue 頁面
  → new WebSocket('ws://localhost:8000/ws/market/<code>/')
    → MarketDataConsumer.connect()
      → SubscriptionManager.subscribe(code, channel_name)
        → MarketDataManager.subscribe_tick(contract)
        → MarketDataManager.subscribe_bidask(contract)
          → api.quote.subscribe(contract, QuoteType.Tick, v1)
          → api.quote.subscribe(contract, QuoteType.BidAsk, v1)

Shioaji 回呼觸發：
  → MarketDataManager._on_tick_callback(exchange, tick)
    → 通知所有 tick_listeners
      → SubscriptionManager._on_tick(code, tick_data)
        → Channels group_send("market_<code>", data)
          → MarketDataConsumer.market_data(event)
            → WebSocket.send(JSON)
              → Vue onmessage handler → 頁面更新

斷線清理：
  → MarketDataConsumer.disconnect()
    → SubscriptionManager.unsubscribe(code, channel_name)
      → 若無其他監聽者 → MarketDataManager.unsubscribe(contract)
```

## 3. TWSE 公開資料流

```
features/explorer/composables/useExplorerData.ts
  → api.get('/stocks/')
    → StockListView.get()
      → TWSEService.get_all_stocks()
        → requests.get('https://openapi.twse.com.tw/v1/...')
        → CacheManager 快取
      → 搜尋 / 篩選 / 排序 / 分頁（在 View 層處理）
    ← Response
```

## 4. 新聞資料流

```
features/news/composables/useNewsData.ts
  → api.get('/news/')
    → NewsListView.get()
      → NewsService.get_news()
        → 鉅亨網 API (api.cnyes.com) — JSON
        → ETtoday RSS (feeds.feedburner.com) — XML
        → CacheManager（TTL 600s）
        → 合併 + 依時間排序
```

## 5. 策略與回測流

```
features/strategy/composables/useStrategyData.ts
  → api.post('/strategies/')                     # 建立策略
    → StrategyService.create(data)
      → strategies.json 寫入

  → api.post('/strategies/<id>/backtest/')       # 執行回測
    → BacktestService.run_backtest(strategy, days)
      → QuoteService.get_kbars() — 歷史 K 線
      → 逐日檢查條件（SMA、成交量、法人）
      → 產生訊號日期 + 績效指標
```

## 6. 選股漏斗流

```
features/explorer/composables/useFunnelData.ts
  Layer 1: api.get('/funnel/sectors/')
    → FunnelService.get_layer1_sectors()
      → TWSEService 產業分類 + THEME_MAP 主題分類

  Layer 2: api.post('/funnel/layer2/', { codes, filters })
    → FunnelService.screen_layer2()
      → TWSEService 取得股票資料 → 套用量化篩選條件

  Layer 3: api.post('/funnel/layer3/', { codes })
    → FunnelService.screen_layer3()
      → QuoteService 取得 K 線 → 技術評分（ThreadPoolExecutor 並行）
```

## 7. 選股 Pipeline 流（四步驟 UI + pipeline app）

四步驟 UI 在 `pages/analysis/pipeline/step1~4 + confirm.vue`，狀態暫存於 `stores/pipelineStore.ts`。

```
Step 1（選股）
  ← 來源：手動輸入 / 從 /analysis/explorer 帶入 / Scanner query string
  → pipelineStore.selectedCodes

Step 2（週期）
  → pipelineStore.timeframe  (preset: 當沖/短線/波段/長線, days: N)

Step 3（訊號）
  v-model 選擇訊號（MA 交叉、MACD、KD、突破）+ 參數
  → api.post('/pipeline/match/', { symbols, signals, params, mode, lookback_days })
    → PipelineService.match()
      → QuoteService.get_kbars 逐檔取 K 線
      → market/technicals.py 計算指標
      → 回傳各 symbol 匹配結果 + 當前 close
  → 頁面顯示命中狀態

Step 4（部位風控）
  資金配置 + 停損停利輸入
  → 再呼叫一次 /pipeline/match/ 取最新 close 做預覽計算

Confirm
  → api.post('/pipeline/commit/', { items, meta })
    → PipelineService.commit()
      → 逐檔寫入 Candidate(symbol, meta)
  → 跳轉 /strategy/candidates/ 或 /trading/trader

列出未消化候選：
  → api.get('/pipeline/pending/')
    → Candidate.objects.filter(consumed=False)
```

## 8. 標籤式選股流（tags app in screener）

```
pages/analysis/tags.vue
  composable: features/tags/composables/useTagFilter.ts
  onMounted:
    → api.get('/tags/options/')
      → TagService.get_options()
        → 即時掃 TWSEService.get_all_stocks() 算 industry 清單
        → 回傳 9 維度可用值 + _get_trend_tags_updated_at()（StockTrendTag 最新 updated_at）
    → api.post('/tags/filter/', { offset: 0, limit: 100 })
      → TagService.filter(selectors)
        → 每檔 map 出 tags.industry/liquidity/cap_size/style/momentum/trend/valuation/dividend/flags/special
        → trend/flags 部分由 StockTrendTag 批次結果補強
        → AND（維度間）× OR（維度內）過濾，結果按 turnover 排序
        → 依 offset/limit 切片後回傳，count=全部符合數

使用者點選任一維度 chip：
  → toggleValue(group, value) → fetchResults() → 回到 offset=0 重新 POST

載入更多（hasMore = results.length < count）：
  → loadMore() → POST /tags/filter/（offset = 當前 results.length）
  → results.concat(data.results)
```

背景批次：`python manage.py rebuild_tags` → 拉 70 日 K 線、算 MA/RSI、爆量判定 → 寫 `StockTrendTag`（symbol/trend/ma*/rsi14/avg_volume_5d/flags JSON）。

## 9. 交易 Pipeline 流（五階段 + 橫切）

```
① Scanner
  POST /api/scanner/run/
    ScannerService.run_from_funnel(codes, filters, topN)
      → FunnelService.screen_layer2 + screen_layer3
      → 寫 Candidate(symbol, score, meta)

② Trader（trading/trader/Home.vue 批次下單面板）
  POST /api/trader/execute/ { capital, prices, live?, tradePin?, expectedVenue? }
    TraderService.execute()
      → 讀 Candidate.filter(consumed=False)
      → 等權重 sizing: capital / N / price / 1000 → qty
      → RiskGuardService.check_entry(symbol, qty, price, capital)
        └─ 黑名單 / 最大部位數 / 部位 % 上限 / 單日虧損
      → paper: 直接寫 Order(FILLED) + Position + Trade
      → broker: 先建立 Order(PENDING, client_ref) → AccountService.place_order
                → Order(SUBMITTED, external_id)；成交前無 Position/Trade
      → 成功後將 Candidate.consumed = True

③ Watchdog（trading/watchdog/Home.vue 純監控）
  監控資料：
    → api.get('/trader/positions/')
    → api.get('/watchlist/?codes=...')（多檔 snapshots）
    → api.get('/watchdog/exit-signals/?all=1')
    front-end: features/trade/composables/useWatchdogMonitor.ts 合併計算
      → 每 open position 的 currentPrice / changePct / distanceToSL / distanceToTP / risk

  實際掃描（由 Exiter 頁面或 command 觸發）：
    POST /api/watchdog/check/   或   manage.py watchdog_loop --interval 10
      WatchdogService.check(prices=None)
        → prices 省略時：QuoteService.snapshots 自動拉所有 open 持倉的即時價
        → 對 open Position 逐一比對 avg_cost
        → 觸發停損/停利 → 寫 ExitSignal(pending)

④ Exiter
  POST /api/exiter/execute/ { live?, tradePin?, expectedVenue? }
    ExiterService.execute()
      → 逐一消化 pending ExitSignal
      → 全量清倉：Position.qty 全部市價賣
      → paper: Order(FILLED) + Trade(with pnl) + Position→CLOSED
      → broker: place_order → Order(SUBMITTED)；Position 保持 OPEN，無實現 PnL
      → 標記 ExitSignal.processed

⑤ Bookkeeper（trading/bookkeeper/Home.vue + Report.vue）
  GET /api/bookkeeper/report/
    BookkeeperService.get_report()
      → 讀全部 Trade → 計算勝率、expectancy、profit factor
      → Sharpe / Sortino（以單筆 PnL 序列 × √252）
      → Max Drawdown（絕對 + %）、Calmar
      → 權益曲線（累計 PnL per trade）

Shioaji 成交回呼（live mode）
  AccountService.prepare_order → api.set_order_callback(FillHandler._raw_callback)
  券商 StockDeal 事件 → FillHandler.on_fill(trade_id, custom_field, exchange_seq)
    → 以 client_ref/external_id 匹配，BrokerFill 以成交序號去重
    → 買進建立／增加 Position，賣出扣減 Position 並認列 Trade.pnl
    → 部分成交為 PARTIALLY_FILLED，全部成交才是 FILLED
  回呼中斷 → python manage.py reconcile_broker_orders 補入券商已確認 deal
```

## 10. 帳戶成交紀錄流（account app → bookkeeper 頁面）

```
pages/trading/bookkeeper/Home.vue
  features/bookkeeper/composables/useHistoryData.ts
    → api.get('/account/trades/')
      → RecentTradesView.get()
        → AccountService.get_recent_trades()
          → Shioaji api.list_trades()
          → 每筆補算 amount / fee / tax（台股標準公式：手續費 0.1425%、賣出證交稅 0.3%、fee 最低 20 元）
  前端映射為 TradeRecord（pnl 保持 null；pnl 需透過 /bookkeeper/trades/ 取 Pipeline 的 Trade）
```

## 11. 術語詞彙表流（glossary）

```
features/featureGuide/composables/useGlossary.ts / useGlossaryData.ts
  → api.get('/glossary/')              # 全部術語
  → api.get('/glossary/search/?q=xx')  # 模糊搜尋（最多 8 筆）

seed：python manage.py seed_glossary（初始 ~70 筆到 GlossaryTerm）
Header 搜尋列（components/layout/HeaderTermSearch.vue）即用此 API。
```
