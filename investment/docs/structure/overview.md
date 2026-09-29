# Pulse — 台股投資分析與交易平台

## 專案目的

個人台股投資分析與交易平台，整合即時報價、技術分析、選股篩選、策略回測與下單功能。

## 技術堆疊

| 層級 | 技術 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite 7 + Pinia + Vue Router 5（約定式路由） |
| UI | 自製 SCSS（BEM）模組化拆分 + Element Plus + Lucide Icons |
| 後端 | Django 6 + Django REST Framework |
| WebSocket | Django Channels + Daphne（ASGI） |
| 券商 API | Shioaji 1.3.2（永豐金證券） |
| 市場資料 | TWSE / TPEx 公開 API（免認證） |
| 新聞 | 鉅亨網 API + ETtoday RSS |

## 架構概覽

```
瀏覽器 (Vue 3 SPA — 約定式路由由 pages/ 自動生成)
  ├─ HTTP ──→ Django REST API (/api/*)
  │              ├─ core          ──→ ShioajiConnection、ServiceAPIView、CacheManager、JsonRepo
  │              ├─ market        ──→ Shioaji API（報價、K 線）+ TWSE 公開 API
  │              ├─ account       ──→ Shioaji API（帳務、下單）
  │              ├─ profile       ──→ 使用者個人檔案 + 大頭貼上傳
  │              ├─ screener      ──→ 三層選股漏斗 + 標籤系統 + 術語詞彙表
  │              ├─ strategy      ──→ JSON 檔案 CRUD + 回測
  │              ├─ news          ──→ 鉅亨網 + ETtoday
  │              ├─ notes         ──→ Markdown 筆記 CRUD
  │              ├─ analysis      ──→ 操盤賽道分析（政策/預算/基本面/技術指標）
  │              ├─ pipeline      ──→ 四步驟選股 pipeline（訊號比對 + commit 成候選）
  │              │
  │              │   交易 Pipeline（五階段 + 共用 + 橫切）—— 見 docs/structure/trading-pipeline.md
  │              ├─ trading_core  ──→ 共用 Models、Enums、FillHandler
  │              ├─ scanner       ──→ ① 選股 → Candidate
  │              ├─ trader        ──→ ② 進場 → Order + Position
  │              ├─ watchdog      ──→ ③ 監控 → ExitSignal
  │              ├─ exiter        ──→ ④ 出場 → Order + Trade
  │              ├─ bookkeeper    ──→ ⑤ 復盤 → Sharpe / Sortino / Max DD 等
  │              └─ risk_guard    ──→ 橫切風控（黑名單、部位上限、單日虧損）
  └─ WebSocket ──→ Channels Consumer (/ws/market/<code>/)
                     └─ MarketDataManager（market/stream.py）
                          └─ Shioaji 即時串流
```

## 啟動方式

```bash
# 後端（PowerShell）
.\activate_backend.ps1
# 或手動：backend\.venv\Scripts\Activate.ps1 → python backend\manage.py runserver

# 前端
cd frontend && npm run dev
```

## 關鍵設計模式

- **ServiceAPIView** — 所有需要 Shioaji 的 View 繼承此基類（`core/views.py`），統一攔截 `ServiceUnavailable` → 503
- **CacheManager** — Thread-safe TTL 快取（`core/cache.py`，預設 60 秒），所有 service 共用
- **ShioajiConnection** — Singleton（`core/shioaji.py`），管理 Shioaji 連線、憑證載入、模擬/正式模式切換
- **MarketDataManager** — Singleton（`market/stream.py`），管理 WebSocket 訂閱，處理 Shioaji v1 callback，分發 tick/bidask 事件
- **JsonRepo** — 檔案型 CRUD（`core/json_repo.py`），策略、筆記 seed 資料統一介面
- **約定式路由** — 前端 `pages/` 目錄結構自動映射 URL（`pages/analysis/tags.vue` → `/analysis/tags`），詳見 `frontend/src/router/helper/routeHelper.ts`

## 模擬模式

系統預設以模擬模式啟動（`simulation=True`）。可透過 `/api/system/mode/` 切換正式模式。
模擬環境不支援帳務 API（account_balance、settlements），AccountService 會回傳預設模擬資料。

---

## 功能概覽（路由結構）

前端路由全部採用約定式：`pages/` 下的目錄結構即 URL，每個層級都有 `Layout.vue` 作為嵌套 outlet。以下依頂層分類列出。

### 入口

| 路徑 | Page | 說明 |
|------|------|------|
| `/` → `/portal` | `pages/Portal/Home.vue` | 入口儀表板（指數、持股、排行、交易快覽） |

### 分析類 `/analysis/*`

| 路徑 | Page | 說明 |
|------|------|------|
| `/analysis/overview` | `analysis/overview.vue` | 分析總覽 |
| `/analysis/explorer` | `analysis/explorer/Home.vue` | 台股全覽（篩選/排序/分頁、產業、樹圖、排行、三層漏斗） |
| `/analysis/rankings` | `analysis/rankings/Home.vue` | 排行榜 |
| `/analysis/tags` | `analysis/tags.vue` | **標籤式選股**（9 個維度 × 40+ 標籤，批次 rebuild_tags 支援） |
| `/analysis/tsmc` | `analysis/tsmc.vue` | 台積電（2330）專頁 |
| `/analysis/quote` | `analysis/quote/Home.vue` | 個股報價（WebSocket 串流） |
| `/analysis/quote/technical` | `analysis/quote/Technical.vue` | 技術分析 |
| `/analysis/quote/institutional` | `analysis/quote/Institutional.vue` | 三大法人 |
| `/analysis/quote/analysis` | `analysis/quote/Analysis.vue` | 綜合分析 |
| `/analysis/pipeline` | `analysis/pipeline/Home.vue` | **選股 pipeline 四步驟入口** |
| `/analysis/pipeline/step1-4` | `analysis/pipeline/stepN.vue` | 選股→週期→訊號→風控 四步驟 |
| `/analysis/pipeline/confirm` | `analysis/pipeline/confirm.vue` | 下單預覽 → commit 成 Candidate |
| `/analysis/news` | `analysis/news/Home.vue` | 市場快訊 |
| `/analysis/notes` | `analysis/notes/Home.vue` | 筆記專區（Django 資料庫） |
| `/analysis/workflow` | `analysis/workflow/Home.vue` | 操盤 Workflow（六子頁） |
| `/analysis/workflow/checklist` | `Checklist.vue` | SOP 清單 |
| `/analysis/workflow/fundamental` | `Fundamental.vue` | 基本面賽道 |
| `/analysis/workflow/journal` | `Journal.vue` | 交易日誌 + 績效統計 |
| `/analysis/workflow/kanban` | `Kanban.vue` | 看板 |
| `/analysis/workflow/review` | `Review.vue` | 每月復盤 |

### 策略類 `/strategy/*`

| 路徑 | Page | 說明 |
|------|------|------|
| `/strategy` | `strategy/Home.vue` | 我的策略列表 |
| `/strategy/create` | `strategy/Create.vue` | 建立策略 |
| `/strategy/:id` | `strategy/[id]/Home.vue` | 策略詳情 |
| `/strategy/:id/edit` | `strategy/[id]/Edit.vue` | 編輯策略 |
| `/strategy/:id/backtest` | `strategy/[id]/Backtest.vue` | 回測分析 |
| `/strategy/candidates` | `strategy/candidates/Home.vue` | 候選股清單（Pipeline commit 後的中繼頁） |

### 交易類 `/trading/*`（五階段交易 Pipeline）

| 路徑 | Page | 說明 |
|------|------|------|
| `/trading` | `trading/Home.vue` | 交易首頁 |
| `/trading/trader` | `trading/trader/Home.vue` | **Trader · 進場**：Pipeline 候選整合 + 單檔下單 + 批次等權 |
| `/trading/watchdog` | `trading/watchdog/Home.vue` | **Watchdog · 持倉監控**：現價、停損停利距離、風險標籤 |
| `/trading/watchdog/pipeline` | `watchdog/Pipeline.vue` | 五階段全 pipeline 整合頁（Scanner/Trader/Watchdog/Exiter/Bookkeeper 單頁 tab） |
| `/trading/exiter` | `trading/exiter/Home.vue` | **Exiter · 出場**：停損停利設定、一鍵平倉、歷史出場 |
| `/trading/bookkeeper` | `trading/bookkeeper/Home.vue` | 交易紀錄 + 績效統計（勝率、期望值、最大獲利 / 虧損、手續費 / 稅） |
| `/trading/bookkeeper/report` | `bookkeeper/Report.vue` | Bookkeeper 完整績效報表（Sharpe / Sortino / Max DD / Calmar / Profit Factor / 權益曲線） |

### 其他

| 路徑 | Page | 說明 |
|------|------|------|
| `/featureGuide` | `featureGuide/Home.vue` | 功能指南列表 |
| `/featureGuide/:moduleId` | `featureGuide/[moduleId].vue` | 單一模組指南 |
| `/settings` | `settings/Home.vue` | 設定（API、主題、交易、通知、Profile） |
| `/guide` | `Guide/Home.vue` | 投資術語詞彙表 |
| `/structure` | `Structure/Home.vue` | 專案架構（dev 工具） |

### 舊路徑相容

`frontend/src/router/routes/basicRoutes.ts` 保留約 40 條 301 redirect，涵蓋：

- `/scanner/*` → `/analysis/*`（早期命名遷移）
- `/market/*` → `/analysis/quote/*`
- `/trade`、`/portfolio`、`/history` → `/trading/*`
- `/pipeline/*` → `/analysis/pipeline/*`

### 筆記資料來源

筆記頁面透過 `/api/notes/` 讀寫 Django `notes.Note` 資料表。`frontend/src/data/seedNotes.json` 僅保留為遷移前快照，既有筆記由 `notes.0002_import_seed_notes` 匯入，不再直接修改該檔案。
