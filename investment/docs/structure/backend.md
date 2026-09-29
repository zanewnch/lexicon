# 後端模組詳解

## 錯誤追蹤與日誌

- Django 啟動時會在 `backend/logs/app.log` 建立 UTF-8 輪替日誌（單檔 10 MB，保留 10 份）；此目錄與日誌檔不納入 Git。
- 前端每個 API 請求都帶 `X-Request-ID`，後端會在回應標頭帶回同一編號；錯誤提示顯示 HTTP 狀態、API 路徑及追蹤編號。
- `core.middleware.RequestLoggingMiddleware` 記錄 API 請求開始與完成耗時，因此尚未回應的請求也能在 log 中查到開始紀錄；4xx/5xx 分級記錄，未處理例外會寫入 traceback。用畫面上的追蹤編號搜尋 `app.log`。
- 前端會區分 HTTP 錯誤、請求逾時、無回應、取消及請求設定錯誤；逾時或無回應通常要再檢查本機 Django 與外部資料來源。

## 目錄結構（16 個 Django apps）

```
backend/
├── backend/              # Django 專案設定
│   ├── settings.py       # Django 6 設定（含外部 API URL 常數、INSTALLED_APPS 含所有 16 apps）
│   ├── urls.py           # 根路由：/admin/ + /api/（多 app include）+ /media/（avatars）
│   ├── asgi.py           # ASGI 入口（Channels）
│   └── wsgi.py
├── core/                 # 共用基礎設施
├── market/               # 市場行情（含 WebSocket）
├── account/              # 帳戶 & 下單（Shioaji）
├── profile/              # 使用者個人檔案 + 大頭貼
├── screener/             # 選股漏斗 + 標籤系統 + 術語詞彙表
├── analysis/             # 操盤賽道分析（政策/預算/基本面/技術指標）
├── pipeline/             # 選股 pipeline（訊號比對 + commit 成 Candidate）
├── strategy/             # 策略管理 + 回測
├── news/                 # 新聞聚合
├── notes/                # Markdown 筆記
│
│── 交易 Pipeline 五階段 + 共用 + 橫切 ───
├── trading_core/         # 5 個資料契約 Model + Enums + FillHandler
├── scanner/              # ① 選股 → Candidate
├── trader/               # ② 進場 → Order + Position
├── watchdog/             # ③ 監控 → ExitSignal
├── exiter/               # ④ 出場 → Order + Trade
├── bookkeeper/           # ⑤ 復盤 → 績效報表
├── risk_guard/           # 橫切風控
│
├── manage.py
└── requirements.txt
```

## Django Apps 總覽

| App | 職責 |
|-----|------|
| `core` | ServiceAPIView、ShioajiConnection、CacheManager、JsonRepo、統一回應格式 |
| `market` | 大盤指數、個股報價、K 線、技術指標、法人買賣超、TWSE 爬蟲、WebSocket 串流 |
| `account` | 投資組合、持股、成交紀錄、下單、五檔、交割（+ 台股手續費 / 證交稅估算） |
| `profile` | 使用者 UserProfile（displayName、avatar） |
| `screener` | 三層選股漏斗 +  **StockTrendTag 標籤系統** + **GlossaryTerm 術語詞彙表** |
| `analysis` | 操盤賽道分析：政策新聞、政府預算、基本面（FinMind）、技術指標、法說會新聞 |
| `pipeline` | 選股 pipeline 四步驟：訊號比對（MA / MACD / KD / 突破）+ commit 成 Candidate |
| `strategy` | 策略 CRUD（JSON 持久化）+ 歷史回測 |
| `news` | 鉅亨網 + ETtoday |
| `notes` | Markdown 筆記 CRUD，資料儲存在 Django 資料庫 |
| `trading_core` | 交易 Pipeline 共用：5 Model、Enums、FillHandler |
| `scanner` | 交易 Pipeline ① 選股 |
| `trader` | 交易 Pipeline ② 進場（等權 sizing、paper/live 雙模式、RiskGuard 檢查） |
| `watchdog` | 交易 Pipeline ③ 監控（固定 % 停損停利、背景 loop） |
| `exiter` | 交易 Pipeline ④ 出場 |
| `bookkeeper` | 交易 Pipeline ⑤ 復盤（Sharpe / Sortino / Max DD / Calmar / Profit Factor） |
| `risk_guard` | 橫切風控：黑名單、部位上限、單日虧損；RiskConfig singleton |

交易 Pipeline 完整設計見 **[trading-pipeline.md](./trading-pipeline.md)**。

## Models（持久化）

| App | Model | 職責 |
|-----|-------|------|
| `trading_core` | Candidate | Scanner 輸出，Trader 輸入 |
| `trading_core` | Order | 委託單（PENDING / SUBMITTED / FILLED / CANCELLED / FAILED） |
| `trading_core` | Position | 開倉部位（OPEN / CLOSED） |
| `trading_core` | ExitSignal | Watchdog → Exiter 信號 |
| `trading_core` | Trade | 成交紀錄（Bookkeeper 消費） |
| `screener` | GlossaryTerm | 術語詞彙表（key / term / description / category / example） |
| `screener` | StockTrendTag | 批次計算的技術標籤快取（symbol / trend / ma5/20/60 / rsi14 / avg_volume_5d / flags JSON） |
| `risk_guard` | RiskConfig | 風控參數 singleton（pk=1） |
| `notes` | Note | 筆記 CRUD |
| `profile` | UserProfile | 使用者個人檔案（displayName、avatar ImageField） |

## Services 層

| Service | 所在 | 職責 | 資料來源 |
|---------|------|------|----------|
| `CacheManager` | `core/cache.py` | Thread-safe TTL 快取基底 | — |
| `ShioajiConnection` | `core/shioaji.py` | Singleton 連線、憑證、模式切換 | Shioaji |
| `JsonRepo` | `core/json_repo.py` | JSON 檔案 CRUD 工具 | 本地 JSON |
| `QuoteService` | `market/quote.py` | 指數、個股、K 線、詳情、多檔 snapshots | Shioaji |
| `TWSEService` | `market/twse.py` | 全股票、產業、排行、三大法人 | TWSE / TPEx |
| `technicals` | `market/technicals.py` | MA / RSI / KD / MACD、多頭排列、爆量紅棒 | — |
| `MarketDataManager` | `market/stream.py` | WebSocket 訂閱、tick/bidask 回呼分發 | Shioaji |
| `AccountService` | `account/service.py` | 投資組合、持股、成交（+ fee/tax 估算）、下單、五檔 | Shioaji |
| `FunnelService` | `screener/service.py` | 三層漏斗 | TWSEService + QuoteService |
| `TagService` | `screener/tags.py` | 9 維度標籤即時計算（industry / liquidity / cap_size / style / momentum / trend / valuation / dividend / flags / special） | TWSEService + StockTrendTag |
| `PipelineService` | `pipeline/service.py` | 選股訊號比對 + commit 到 Candidate table | QuoteService + technicals |
| `NewsService` | `news/service.py` | 鉅亨網 + ETtoday | 外部 API |
| `StrategyService` | `strategy/service.py` | 策略 CRUD（JSON 持久化） | 本地 JSON |
| `BacktestService` | `strategy/backtest.py` | 策略歷史回測 | QuoteService + TWSEService |
| `RiskGuardService` | `risk_guard/service.py` | Entry 檢查、stats 聚合 | RiskConfig + Position + Trade |

## API 端點（基礎路徑 `/api/`）

### 系統（core）

| 端點 | Method | View |
|------|--------|------|
| `system/mode/` | GET / POST | SystemModeView |

### 市場資料（market）

| 端點 | Method | View |
|------|--------|------|
| `indices/` | GET | IndicesView |
| `stocks/` | GET | StockListView |
| `stocks/treemap/` | GET | StockTreemapView |
| `stocks/rankings/` | GET | StockRankingsView |
| `stocks/<code>/` | GET | StockDetailView |
| `stocks/<code>/kline/` | GET | StockKlineView |
| `stocks/<code>/institutional/` | GET | StockInstitutionalView |
| `stocks/<code>/technicals/` | GET | StockTechnicalsView |
| `stocks/<code>/bidask/` | GET | BidAskView |
| `stocks/<code>/limits/` | GET | LimitPricesView |
| `sectors/` | GET | SectorListView |
| `sectors/<name>/` | GET | SectorDetailView |
| `watchlist/` | GET | WatchlistView |

### 帳戶 & 下單（account）

| 端點 | Method | View | 備註 |
|------|--------|------|------|
| `account/portfolio/` | GET | PortfolioSummaryView | 投資組合摘要 |
| `account/holdings/` | GET | HoldingsListView | 持股明細 |
| `account/trades/` | GET | RecentTradesView | **回傳含 `amount` / `fee` / `tax`（台股標準公式估算）** |
| `account/order/` | POST | PlaceOrderView | 下單 |
| `account/settlements/` | GET | SettlementsListView | 交割清單 |

### 個人檔案（profile）

| 端點 | Method | View |
|------|--------|------|
| `profile/` | GET / PUT | ProfileView |
| `profile/avatar/` | POST | AvatarView |

### 選股漏斗 + 標籤 + 詞彙表（screener）

| 端點 | Method | View | 說明 |
|------|--------|------|------|
| `funnel/sectors/` | GET | FunnelSectorsView | Layer 1：產業 + 主題 |
| `funnel/layer2/` | POST | FunnelLayer2View | Layer 2：量化篩選 |
| `funnel/layer3/` | POST | FunnelLayer3View | Layer 3：技術評分 |
| `tags/options/` | GET | TagOptionsView | 9 維度可用標籤 + `trendTagsUpdatedAt`（StockTrendTag 最新時間） |
| `tags/filter/` | POST | TagFilterView | AND of（每維度 OR）；body 可帶 `offset` / `limit`（預設 0 / 100，最大 500）；response 回 `{count, offset, limit, results}` |
| `glossary/` | GET | GlossaryListView | 全部術語 |
| `glossary/search/` | GET | GlossarySearchView | 模糊搜尋（最多 8 筆） |

### 操盤賽道分析（analysis）

| 端點 | Method | View |
|------|--------|------|
| `analysis/indicators/` | GET | IndicatorsView |
| `analysis/policy/` | GET | PolicyNewsView |
| `analysis/budget/` | GET | BudgetView |
| `analysis/fundamental/` | GET | FundamentalView |
| `analysis/finmind-token-status/` | GET | FinMindTokenStatusView |
| `analysis/earnings-news/` | GET | EarningsNewsView |

### 選股 Pipeline（pipeline）

| 端點 | Method | View | 說明 |
|------|--------|------|------|
| `pipeline/match/` | POST | PipelineMatchView | 訊號比對（MA 交叉、MACD、KD、突破） |
| `pipeline/commit/` | POST | PipelineCommitView | 寫入下單清單 → Candidate table |
| `pipeline/pending/` | GET | PipelinePendingView | 列出未消化的 Candidate |

### 策略（strategy）

| 端點 | Method | View |
|------|--------|------|
| `strategies/` | GET / POST | StrategyListView |
| `strategies/<id>/` | GET / PUT / DELETE | StrategyDetailView |
| `strategies/<id>/toggle/` | POST | StrategyToggleView |
| `strategies/<id>/backtest/` | POST | StrategyBacktestView |

### 新聞（news） / 筆記（notes）

| 端點 | Method | View |
|------|--------|------|
| `news/` | GET | NewsListView |
| `notes/` | GET / POST | NoteListView |
| `notes/<pk>/` | GET / PUT / DELETE | NoteDetailView |

### 交易 Pipeline（scanner / trader / watchdog / exiter / bookkeeper / risk_guard）

| 端點 | Method | 說明 |
|------|--------|------|
| `scanner/run/` | POST | `{ symbols: [] }` 或 `{ funnel: { codes, filters, topN, minScore } }` |
| `scanner/candidates/` | GET | `?all=1` 顯示已採用 |
| `trader/execute/` | POST | `{ capital, prices, live?, tradePin? }` |
| `trader/positions/` | GET | `?all=1` 顯示平倉 |
| `watchdog/check/` | POST | `{ prices?, stopLossPct?, takeProfitPct? }` |
| `watchdog/exit-signals/` | GET | `?all=1` 顯示已處理 |
| `exiter/execute/` | POST | `{ live?, tradePin? }` |
| `bookkeeper/report/` | GET | 績效報表（Sharpe / Sortino / Max DD / Calmar / Profit Factor / 權益曲線） |
| `bookkeeper/trades/` | GET | `?limit=N` |
| `risk/config/` | GET / PUT | 調整風控參數 |
| `risk/stats/` | GET | 當下 open positions、今日實現 PnL |

## Management Commands

| 命令 | 所在 App | 說明 |
|------|----------|------|
| `python manage.py rebuild_tags [--top 500] [--symbols 2330 2317]` | `screener` | 夜間批次：拉 70 日 K 線、算 MA/RSI/爆量/排列，寫入 `StockTrendTag`；並行 workers=6 |
| `python manage.py seed_glossary` | `screener` | 初始化 ~70 筆術語到 `GlossaryTerm` table |
| `python manage.py watchdog_loop --interval 10 [--max-iter N]` | `watchdog` | 背景輪詢監控持倉，SIGINT/SIGTERM graceful shutdown |
| `python manage.py activate_broker_callback` | `trader` | 註冊 Shioaji 成交回呼（`FillHandler`） |

## WebSocket 端點（market）

| 端點 | Consumer | 說明 |
|------|----------|------|
| `ws/market/<code>/` | MarketDataConsumer | 即時 tick + bidask |

訊息格式：

- **tick**: `{ type: "tick", code, time, price, volume, totalVolume, tickType }`
- **bidask**: `{ type: "bidask", code, askPrices[5], askVolumes[5], bidPrices[5], bidVolumes[5], time }`
- **ping/pong**: 發送 `{ action: "ping" }` 收到 `{ type: "pong" }`

## Schemas（`market/schemas.py`）

| Dataclass | 欄位 | 用途 |
|-----------|------|------|
| `TickData` | code, close, volume, total_volume, tick_type, timestamp | 逐筆成交 |
| `BidAskData` | code, bid_prices[5], bid_volumes[5], ask_prices[5], ask_volumes[5], timestamp | 五檔 |

## 外部 API 設定（`backend/settings.py`）

| 常數 | 用途 |
|------|------|
| `ANUE_SEARCH_URL` | 鉅亨網新聞 |
| `EY_NEWS_URL` | 行政院新聞稿（SSL verify=False） |
| `EY_BASE_URL` | 行政院基底 URL |
| `DATA_GOV_API_URL` | 政府資料完整清單（本地過濾） |
| `MEDIA_ROOT` / `MEDIA_URL` | Avatar 上傳目錄（`backend/media/avatars/`） |
