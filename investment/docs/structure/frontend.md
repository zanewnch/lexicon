# 前端模組詳解

## 技術架構

- **框架**: Vue 3 + TypeScript + Vite 7
- **狀態管理**: Pinia（多檔拆分）
- **路由**: Vue Router 5 —— **約定式路由**，由 `pages/` 目錄結構自動生成
- **UI**: 自製 SCSS（BEM）模組化結構 + Element Plus + Lucide Icons
- **圖表**: Chart.js + vue-chartjs（含自製十字準線 plugin）
- **API**: Axios（封裝在 `src/api/client.ts`，baseURL 預設 `http://localhost:8000/api`）

## 目錄結構

```
frontend/src/
├── api/                  # Axios 實例 + 專屬 API client
├── components/           # 共用元件
│   ├── layout/           # 版面（Header、Sidebar、BottomNav、PageHeader、SimulationBanner）
│   └── ui/               # UI 原件（Button、Card、Badge、DataTable、TabBar、StatCard、FormField …）
├── composables/          # 頂層 utility composables（跨模組）
├── data/                 # 靜態資料（seedNotes.json、featureGuide、dummy）
├── features/             # 按「功能領域」組織的 components + composables
├── pages/                # 約定式路由目標（目錄結構 = URL）
├── router/               # 路由定義 + guards + helper
├── store/                # Pinia store（主要版本，多檔）
├── stores/               # Pinia store（pipeline 專用）
├── styles/               # SCSS 模組化結構
├── types/                # TypeScript 型別定義
├── utils/                # 純函式工具
├── plugins/              # Vite 插件 / Chart.js 插件
├── App.vue
└── main.ts
```

## 路由（Router）

- **`router/index.ts`** — 主入口，組裝 basicRoutes + pagesRoutes
- **`router/routes/basicRoutes.ts`** — 不走約定的特例路由：`/` 重導向 `/portal` + 約 40 條舊路徑 301 redirect（`/scanner/*`、`/market/*`、`/trade`、`/portfolio`、`/history`、`/pipeline/*`、`/trader` 等）
- **`router/routes/pagesRoutes.ts`** — 由 `helper/routeHelper.ts` 掃描 `pages/` 生成約定式路由
- **`router/guards/permission.ts`** — 路由守衛

### 約定式路由規則

| 檔案位置 | URL |
|---------|-----|
| `pages/analysis/tags.vue` | `/analysis/tags` |
| `pages/analysis/quote/Home.vue` | `/analysis/quote`（每層資料夾預設 Home.vue） |
| `pages/analysis/quote/Technical.vue` | `/analysis/quote/technical` |
| `pages/strategy/[id]/Edit.vue` | `/strategy/:id/edit`（動態參數） |
| `pages/<x>/Layout.vue` | 嵌套 outlet，不產生獨立 URL |

路由清單完整對照見 [overview.md](./overview.md)。

## Pages（70+ .vue）

### 頂層

```
pages/
├── Portal/          Home.vue · Layout.vue              入口儀表板
├── Guide/           Home.vue · Layout.vue              投資術語
├── Structure/       Home.vue · Layout.vue              架構 dev 工具
├── featureGuide/    Home.vue · Layout.vue · [moduleId].vue  功能指南
├── settings/        Home.vue · Layout.vue              設定頁
├── analysis/        (見下)                             分析類
├── strategy/        (見下)                             策略類
└── trading/         (見下)                             交易類
```

### `/analysis/*` 分析

```
analysis/
├── Layout.vue
├── overview.vue                   # /analysis/overview — 總覽
├── tags.vue                       # /analysis/tags — 標籤式選股（9 維度 × 40+ 標籤）
├── tsmc.vue                       # /analysis/tsmc — 台積電專頁
├── explorer/    Home.vue · Layout.vue      # 台股全覽（篩選/排序/產業/樹圖/漏斗）
├── rankings/    Home.vue · Layout.vue      # 排行榜
├── quote/       Home.vue · Layout.vue · Technical.vue · Institutional.vue · Analysis.vue
│                                  # 個股報價（WebSocket 串流）
├── news/        Home.vue · Layout.vue      # 市場快訊
├── notes/       Home.vue · Layout.vue      # 筆記專區
├── pipeline/    Home.vue · Layout.vue · step1.vue · step2.vue · step3.vue · step4.vue · confirm.vue
│                                  # 選股 pipeline 四步驟
└── workflow/    Home.vue · Layout.vue · Checklist.vue · Fundamental.vue · Journal.vue · Kanban.vue · Review.vue
                                   # 操盤 Workflow 六子頁
```

### `/strategy/*` 策略

```
strategy/
├── Home.vue · Layout.vue          # 我的策略
├── Create.vue                     # 建立策略
├── [id]/   Home.vue · Layout.vue · Edit.vue · Backtest.vue
└── candidates/  Home.vue · Layout.vue  # Pipeline commit 的候選股中繼頁
```

### `/trading/*` 交易

```
trading/
├── Home.vue · Layout.vue                            # 交易首頁
├── trader/      Home.vue · Layout.vue               # Trader · 進場（Pipeline 候選 + 單檔 + 批次）
├── watchdog/    Home.vue · Layout.vue · Pipeline.vue
│                                                    # Watchdog · 持倉監控；Pipeline.vue 五階段整合單頁
├── exiter/      Home.vue · Layout.vue               # Exiter · 出場
└── bookkeeper/  Home.vue · Layout.vue · Report.vue  # Bookkeeper · 交易紀錄 + 完整績效報表
```

## Features（按領域組織）

`src/features/` 下每個子資料夾對應一個功能領域，通常包含 `components/` 與 `composables/`。

| 資料夾 | 主要內容 |
|--------|----------|
| `bookkeeper/` | `composables/useHistoryData.ts` — 成交紀錄（含 fee/tax/pnl 映射） |
| `explorer/` | `components/` Funnel/Rankings/Screener/Sectors/Treemap；`composables/useExplorerData`、`useFunnelData` |
| `featureGuide/` | `components/` FeatureGuideList/Detail/PageGuideButton；`composables/useFeatureGuide`、`useGlossary`、`useGlossaryData` |
| `home/` | `components/` Dashboard*、MarketSignals；`composables/useHomeData`、`useMarketSignals` |
| `market/` | `composables/` useMarketData、useMarketStatus、useStockAnalysis、useStockSearch |
| `news/` | `composables/useNewsData` |
| `pipeline/` | `components/` SignalCheckboxRow、SizingTable、StepStepper、TimeframePresetCard |
| `portfolio/` | `composables/usePortfolioData` |
| `settings/` | `components/` SettingsAPI、SettingsAlerts、SettingsDisplay、SettingsNotifications、SettingsTrading、SettingsProfile |
| `strategy/` | `components/StrategyForm`；`composables/useStrategyData` |
| `tags/` | `components/TagFilterGroup`；`composables/useTagFilter` |
| `trade/` | `components/` TradeOrderBook、TradeOrderForm、TradeOrderHistory；`composables/useTradeData`、`useTradingData`、`useWatchdogMonitor`、`useFlashHighlight`、`useFormValidation` |
| `tsmc/` | `components/` TsmcBusiness、TsmcEarnings、TsmcFinancials、TsmcPrice、TsmcSupplyChain；`composables/useTsmcData` |
| `workflow/` | `components/` funnel/* · kanban/* |

## 頂層 Composables（`src/composables/`）

跨功能領域的共用工具：

| 檔案 | 用途 |
|------|------|
| `useAsyncData.ts` | 非同步資料載入封裝（loading / error / data / execute） |
| `usePagination.ts` | 通用分頁 |
| `useReconnect.ts` | WebSocket 重連 |
| `useTableSort.ts` | 表格排序 |
| `useToast.ts` | Toast 通知 |

## Stores（Pinia，兩個目錄）

> `store/` 與 `stores/` 同時存在，是重構階段遺留；主要版本為 `store/`，`stores/` 僅剩 `pipelineStore.ts`。

### `src/store/`

| 檔案 | 說明 |
|------|------|
| `app.ts` | 全域：主題切換（17 種）、模擬 / 正式模式 |
| `market.ts` | 行情全域狀態 |
| `profile.ts` | 使用者個人檔案 |

### `src/stores/`

| 檔案 | 說明 |
|------|------|
| `pipelineStore.ts` | 選股 pipeline 四步驟暫存（timeframe / signals / sizing / selected codes） |

## API Client（`src/api/`）

| 檔案 | 說明 |
|------|------|
| `client.ts` | Axios 實例、baseURL、攔截器 |
| `index.ts` | 預設 export `client` |
| `pipeline.ts` | Pipeline 專用 client：`matchSignals` / `commitPipeline` / `listPendingCandidates` |

其他 API 呼叫散布在各 composable 內部，統一用 `import api from '@/api'` 的 axios 實例。

## Styles（SCSS 模組化）

`src/styles/main.scss` 是 entry，依 ITCSS 風格拆分：

```
styles/
├── main.scss
├── abstracts/    _variables.scss       設計 tokens（顏色、間距、字型）
├── base/         _reset.scss           Reset / 基礎排版
├── components/   _animations.scss · _button.scss · _form.scss · _section.scss · _table.scss · _tag.scss
├── layout/       _app.scss             全域 layout
├── themes/       _element-plus.scss    Element Plus 主題覆寫
└── utilities/    _responsive.scss · _text.scss
```

## Types（`src/types/`）

| 檔案 | 說明 |
|------|------|
| `account.ts` | TradeRecord（含 fee / tax / pnl）、投資組合 |
| `common.ts` | 共用型別（SortOrder 等） |
| `explorer.ts` | Explorer 資料結構 |
| `featureGuide.ts` | 功能指南模組設定 |
| `funnel.ts` | 三層漏斗型別 |
| `glossary.ts` | 術語詞彙表 |
| `market.ts` | 行情相關 |
| `notes.ts` | 筆記 |
| `pipeline.ts` | Pipeline（CommitRequestItem、EntryParams、SignalKey、TriggerMode 等） |
| `strategy.ts` | 策略 |
| `trading.ts` | Trading Pipeline（Candidate、Order、Position、ExitSignal、Trade、BookkeeperReport） |
| `workflow.ts` | Workflow（TradeRecord 同名但 shape 不同） |

## Data（`src/data/`）

| 檔案 | 說明 |
|------|------|
| `seedNotes.json` | 筆記遷移前快照；目前筆記經 `/api/notes/` 存在 Django 資料庫 |
| `featureGuide.ts` | 功能指南模組靜態設定 |
| `dummy/` | 測試用假資料 |

## Components

### Layout（`components/layout/`）

- `TheHeader.vue` / `TheSidebar.vue` / `TheBottomNav.vue` — 三件式導覽
- `HeaderSearch.vue` / `HeaderTermSearch.vue` — 搜尋列（股票 / 術語雙模式）
- `HeaderMarketStatus.vue` — 開盤狀態
- `HeaderThemePicker.vue` — 主題選擇器（17 主題）
- `PageHeader.vue` — 頁面共用 header
- `SimulationBanner.vue` — 模擬模式提示條

### UI（`components/ui/`）

原件庫：`Badge` · `Button` · `Card` · `DataTable` · `EmptyState` · `FormField` · `FormRow` · `HelpTip` · `RouterTabBar` · `SectionHeader` · `SidebarPanel` · `SparkLine` · `StatCard` · `SummaryItem` · `TabBar` · `ToastContainer` · `DummyBadge` · `TreeItem`

## Plugins

| 檔案 | 說明 |
|------|------|
| `plugins/projectTree.ts` | Vite 插件：掃描專案目錄生成 `virtual:project-tree` 模組（供 `/structure` 頁面使用） |
| `src/plugins/chartCrosshair.ts` | Chart.js 十字準線插件 |
