# 專案檔案結構

> 自動生成於 2026-04-21 14:54，由 `scripts/gen_structure.py` 產生。

```
investment/
├── backend/
│   ├── account/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── analysis/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── budget_fetchers.py
│   │   ├── earnings_fetchers.py
│   │   ├── fetchers.py
│   │   ├── fundamental_fetchers.py
│   │   ├── policy_fetchers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── bookkeeper/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── cache.py
│   │   ├── json_repo.py
│   │   ├── response.py
│   │   ├── shioaji.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── exiter/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── market/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── consumers.py
│   │   ├── quote.py
│   │   ├── routing.py
│   │   ├── schemas.py
│   │   ├── stream.py
│   │   ├── technicals.py
│   │   ├── twse.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── media/
│   │   └── avatars/
│   │       └── 55238_0.jpg
│   ├── news/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── notes/
│   │   ├── management/
│   │   │   ├── commands/
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── profile/
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── risk_guard/
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── screener/
│   │   ├── management/
│   │   │   ├── commands/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── rebuild_tags.py
│   │   │   │   └── seed_glossary.py
│   │   │   └── __init__.py
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   ├── 0002_glossaryterm.py
│   │   │   ├── 0003_glossaryterm_example.py
│   │   │   ├── 0004_stocktrendtag_avg_volume_5d.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── service.py
│   │   ├── tags.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── strategy/
│   │   ├── data/
│   │   │   └── strategies.json
│   │   ├── management/
│   │   │   ├── commands/
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── backtest.py
│   │   ├── models.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── trader/
│   │   ├── management/
│   │   │   ├── commands/
│   │   │   │   ├── __init__.py
│   │   │   │   └── activate_broker_callback.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── trading_core/
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── enums.py
│   │   ├── fill_handler.py
│   │   └── models.py
│   ├── watchdog/
│   │   ├── management/
│   │   │   ├── commands/
│   │   │   │   ├── __init__.py
│   │   │   │   └── watchdog_loop.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── service.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── db.sqlite3
│   ├── manage.py
│   ├── requirements.txt
│   └── run_market_data.py
├── docs/
│   └── structure/
│       ├── backend.md
│       ├── data-flow.md
│       ├── frontend.md
│       ├── overview.md
│       ├── structure.md
│       └── trading-pipeline.md
├── frontend/
│   ├── plugins/
│   │   └── projectTree.ts
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── index.ts
│   │   │   └── pipeline.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── HeaderMarketStatus.vue
│   │   │   │   ├── HeaderSearch.vue
│   │   │   │   ├── HeaderTermSearch.vue
│   │   │   │   ├── HeaderThemePicker.vue
│   │   │   │   ├── PageHeader.vue
│   │   │   │   ├── SimulationBanner.vue
│   │   │   │   ├── TheBottomNav.vue
│   │   │   │   ├── TheHeader.vue
│   │   │   │   └── TheSidebar.vue
│   │   │   └── ui/
│   │   │       ├── Badge.vue
│   │   │       ├── Button.vue
│   │   │       ├── Card.vue
│   │   │       ├── DataCell.vue
│   │   │       ├── DataTable.vue
│   │   │       ├── DummyBadge.vue
│   │   │       ├── EmptyState.vue
│   │   │       ├── FormField.vue
│   │   │       ├── FormRow.vue
│   │   │       ├── HelpTip.vue
│   │   │       ├── RouterTabBar.vue
│   │   │       ├── SectionHeader.vue
│   │   │       ├── SidebarPanel.vue
│   │   │       ├── SkeletonBlock.vue
│   │   │       ├── SkeletonLoader.vue
│   │   │       ├── SkeletonWrap.vue
│   │   │       ├── SparkLine.vue
│   │   │       ├── StatCard.vue
│   │   │       ├── SummaryItem.vue
│   │   │       ├── TabBar.vue
│   │   │       ├── ToastContainer.vue
│   │   │       └── TreeItem.vue
│   │   ├── composables/
│   │   │   ├── useAsyncData.ts
│   │   │   ├── usePagination.ts
│   │   │   ├── useReconnect.ts
│   │   │   ├── useTableSort.ts
│   │   │   └── useToast.ts
│   │   ├── data/
│   │   │   ├── dummy/
│   │   │   │   ├── history.dummy.ts
│   │   │   │   ├── home.dummy.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── market.dummy.ts
│   │   │   │   ├── portfolio.dummy.ts
│   │   │   │   └── trade.dummy.ts
│   │   │   ├── featureGuide.ts
│   │   │   └── seedNotes.json
│   │   ├── features/
│   │   │   ├── bookkeeper/
│   │   │   │   └── composables/
│   │   │   │       └── useHistoryData.ts
│   │   │   ├── explorer/
│   │   │   │   ├── components/
│   │   │   │   │   ├── funnel/
│   │   │   │   │   │   ...
│   │   │   │   │   ├── ExplorerFunnel.vue
│   │   │   │   │   ├── ExplorerRankings.vue
│   │   │   │   │   ├── ExplorerScreener.vue
│   │   │   │   │   ├── ExplorerSectors.vue
│   │   │   │   │   └── ExplorerTreemap.vue
│   │   │   │   └── composables/
│   │   │   │       ├── useExplorerData.ts
│   │   │   │       └── useFunnelData.ts
│   │   │   ├── featureGuide/
│   │   │   │   ├── components/
│   │   │   │   │   ├── FeatureGuideDetail.vue
│   │   │   │   │   ├── FeatureGuideList.vue
│   │   │   │   │   └── PageGuideButton.vue
│   │   │   │   └── composables/
│   │   │   │       ├── useFeatureGuide.ts
│   │   │   │       ├── useGlossary.ts
│   │   │   │       └── useGlossaryData.ts
│   │   │   ├── home/
│   │   │   │   ├── components/
│   │   │   │   │   ├── DashboardHoldings.vue
│   │   │   │   │   ├── DashboardIndices.vue
│   │   │   │   │   ├── DashboardPortfolio.vue
│   │   │   │   │   ├── DashboardRankings.vue
│   │   │   │   │   ├── DashboardTrades.vue
│   │   │   │   │   ├── HomeFeatureCard.vue
│   │   │   │   │   └── MarketSignals.vue
│   │   │   │   └── composables/
│   │   │   │       ├── useHomeData.ts
│   │   │   │       └── useMarketSignals.ts
│   │   │   ├── market/
│   │   │   │   └── composables/
│   │   │   │       ├── useMarketData.ts
│   │   │   │       ├── useMarketStatus.ts
│   │   │   │       ├── useStockAnalysis.ts
│   │   │   │       └── useStockSearch.ts
│   │   │   ├── news/
│   │   │   │   └── composables/
│   │   │   │       └── useNewsData.ts
│   │   │   ├── pipeline/
│   │   │   │   └── components/
│   │   │   │       ├── SignalCheckboxRow.vue
│   │   │   │       ├── SizingTable.vue
│   │   │   │       ├── StepStepper.vue
│   │   │   │       └── TimeframePresetCard.vue
│   │   │   ├── portfolio/
│   │   │   │   └── composables/
│   │   │   │       └── usePortfolioData.ts
│   │   │   ├── settings/
│   │   │   │   └── components/
│   │   │   │       ├── SettingsAlerts.vue
│   │   │   │       ├── SettingsAPI.vue
│   │   │   │       ├── SettingsDisplay.vue
│   │   │   │       ├── SettingsNotifications.vue
│   │   │   │       ├── SettingsProfile.vue
│   │   │   │       └── SettingsTrading.vue
│   │   │   ├── strategy/
│   │   │   │   ├── components/
│   │   │   │   │   └── StrategyForm.vue
│   │   │   │   └── composables/
│   │   │   │       └── useStrategyData.ts
│   │   │   ├── tags/
│   │   │   │   ├── components/
│   │   │   │   │   └── TagFilterGroup.vue
│   │   │   │   └── composables/
│   │   │   │       └── useTagFilter.ts
│   │   │   ├── trade/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TradeOrderBook.vue
│   │   │   │   │   ├── TradeOrderForm.vue
│   │   │   │   │   └── TradeOrderHistory.vue
│   │   │   │   └── composables/
│   │   │   │       ├── useFlashHighlight.ts
│   │   │   │       ├── useFormValidation.ts
│   │   │   │       ├── useTradeData.ts
│   │   │   │       ├── useTradingData.ts
│   │   │   │       └── useWatchdogMonitor.ts
│   │   │   ├── tsmc/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TsmcBusiness.vue
│   │   │   │   │   ├── TsmcEarnings.vue
│   │   │   │   │   ├── TsmcFinancials.vue
│   │   │   │   │   ├── TsmcPrice.vue
│   │   │   │   │   └── TsmcSupplyChain.vue
│   │   │   │   └── composables/
│   │   │   │       └── useTsmcData.ts
│   │   │   └── workflow/
│   │   │       └── components/
│   │   │           ├── funnel/
│   │   │           │   ...
│   │   │           └── kanban/
│   │   │               ...
│   │   ├── pages/
│   │   │   ├── analysis/
│   │   │   │   ├── explorer/
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── news/
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── notes/
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── pipeline/
│   │   │   │   │   ├── confirm.vue
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   ├── Layout.vue
│   │   │   │   │   ├── step1.vue
│   │   │   │   │   ├── step2.vue
│   │   │   │   │   ├── step3.vue
│   │   │   │   │   └── step4.vue
│   │   │   │   ├── quote/
│   │   │   │   │   ├── Analysis.vue
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   ├── Institutional.vue
│   │   │   │   │   ├── Layout.vue
│   │   │   │   │   └── Technical.vue
│   │   │   │   ├── rankings/
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── Checklist.vue
│   │   │   │   │   ├── Fundamental.vue
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   ├── Journal.vue
│   │   │   │   │   ├── Kanban.vue
│   │   │   │   │   ├── Layout.vue
│   │   │   │   │   └── Review.vue
│   │   │   │   ├── Layout.vue
│   │   │   │   ├── overview.vue
│   │   │   │   ├── tags.vue
│   │   │   │   └── tsmc.vue
│   │   │   ├── featureGuide/
│   │   │   │   ├── [moduleId].vue
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   ├── Guide/
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   ├── Portal/
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   ├── settings/
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   ├── strategy/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── Backtest.vue
│   │   │   │   │   ├── Edit.vue
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── candidates/
│   │   │   │   │   ├── Home.vue
│   │   │   │   │   └── Layout.vue
│   │   │   │   ├── Create.vue
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   ├── Structure/
│   │   │   │   ├── Home.vue
│   │   │   │   └── Layout.vue
│   │   │   └── trading/
│   │   │       ├── bookkeeper/
│   │   │       │   ├── Home.vue
│   │   │       │   ├── Layout.vue
│   │   │       │   └── Report.vue
│   │   │       ├── exiter/
│   │   │       │   ├── Home.vue
│   │   │       │   └── Layout.vue
│   │   │       ├── trader/
│   │   │       │   ├── Home.vue
│   │   │       │   └── Layout.vue
│   │   │       ├── watchdog/
│   │   │       │   ├── Home.vue
│   │   │       │   ├── Layout.vue
│   │   │       │   └── Pipeline.vue
│   │   │       ├── Home.vue
│   │   │       └── Layout.vue
│   │   ├── plugins/
│   │   │   └── chartCrosshair.ts
│   │   ├── router/
│   │   │   ├── guards/
│   │   │   │   └── permission.ts
│   │   │   ├── helper/
│   │   │   │   └── routeHelper.ts
│   │   │   ├── routes/
│   │   │   │   ├── basicRoutes.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── pagesRoutes.ts
│   │   │   └── index.ts
│   │   ├── store/
│   │   │   ├── app.ts
│   │   │   ├── market.ts
│   │   │   └── profile.ts
│   │   ├── stores/
│   │   │   └── pipelineStore.ts
│   │   ├── styles/
│   │   │   ├── abstracts/
│   │   │   │   └── _variables.scss
│   │   │   ├── base/
│   │   │   │   └── _reset.scss
│   │   │   ├── components/
│   │   │   │   ├── _animations.scss
│   │   │   │   ├── _button.scss
│   │   │   │   ├── _form.scss
│   │   │   │   ├── _section.scss
│   │   │   │   ├── _table.scss
│   │   │   │   └── _tag.scss
│   │   │   ├── layout/
│   │   │   │   └── _app.scss
│   │   │   ├── themes/
│   │   │   │   └── _element-plus.scss
│   │   │   ├── utilities/
│   │   │   │   ├── _responsive.scss
│   │   │   │   └── _text.scss
│   │   │   └── main.scss
│   │   ├── types/
│   │   │   ├── account.ts
│   │   │   ├── common.ts
│   │   │   ├── explorer.ts
│   │   │   ├── featureGuide.ts
│   │   │   ├── funnel.ts
│   │   │   ├── market.ts
│   │   │   ├── notes.ts
│   │   │   ├── pipeline.ts
│   │   │   ├── strategy.ts
│   │   │   ├── trading.ts
│   │   │   └── workflow.ts
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── virtual.d.ts
│   ├── .gitignore
│   ├── env.d.ts
│   ├── eslint.config.ts
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tsconfig.vitest.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── obsidian/
│   ├── 台股/
│   │   ├── 術語/
│   │   │   ├── index.md
│   │   │   └── 倉位.md
│   │   ├── ETF入門.md
│   │   ├── test.md
│   │   ├── 上市_vs_上櫃.md
│   │   ├── 交易成本_總覽.md
│   │   ├── 交易規則.md
│   │   ├── 入門清單.md
│   │   ├── 商品差異速覽.md
│   │   ├── 基本面與評價.md
│   │   ├── 手續費.md
│   │   ├── 投資工具抽象模型.md
│   │   ├── 新手誤區.md
│   │   ├── 期貨入門.md
│   │   ├── 看盤指標.md
│   │   ├── 稅務與申報.md
│   │   ├── 術語詞彙表.md
│   │   ├── 跨商品快速比對.md
│   │   ├── 選擇權入門.md
│   │   ├── 重要日期.md
│   │   └── 風險控管.md
│   ├── index.md
│   ├── Script_index.md
│   ├── structure.md
│   ├── 未命名.base
│   ├── 永豐api.md
│   └── 金融_index.md
├── scripts/
│   └── gen_structure.py
├── .gitignore
├── CLAUDE.md
├── credentials.json
├── README.md
└── activate_backend.ps1
```
