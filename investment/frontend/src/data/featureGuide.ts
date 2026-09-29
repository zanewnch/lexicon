import type { ModuleGuide } from '@/types/featureGuide'

export const featureGuideModules: ModuleGuide[] = [
  {
    id: 'scanner',
    label: 'Scanner',
    subtitle: '選股 · 從全市場過濾候選名單',
    iconColor: '#8b5cf6',
    path: '/analysis/explorer',
    summary:
      'Scanner 是操盤流程的起點。整合台股全覽、標籤系統、排行榜、行情分析與策略回測，幫助你從 1,700+ 檔股票中，依照自訂條件快速縮小到值得深入研究的候選清單。',
    whenToUse: [
      '每日盤前掃描：查看漲跌排行、類股輪動，抓住市場熱點',
      '建立候選清單：用標籤（趨勢 / 成長 / 殖利率）分類追蹤標的',
      '個股深入研究：查看行情、法人、技術分析等多維度資料',
      '策略驗證：建立選股條件並跑歷史回測，確認邊際優勢',
    ],
    contexts: ['選股階段'],
    features: [
      { label: '台股全覽', detail: '市值樹圖 + 選股漏斗，快速定位強勢標的' },
      { label: '標籤選股', detail: '自訂標籤分類，建立個人化觀察池' },
      { label: '排行榜', detail: '依漲跌幅、成交量、本益比、殖利率排序' },
      { label: '行情', detail: '個股報價、五檔、K 線、法人買賣超' },
      { label: '技術分析', detail: 'MA / KD / RSI / MACD + 多空訊號自動判定' },
      { label: '法人買賣', detail: '三大法人買賣超、融資融券、外資動向' },
      { label: '供應鏈漏斗', detail: '產業上下游關係視覺化，找關聯標的' },
      { label: '策略', detail: '選股條件組合 + 回測 + 勝率統計' },
    ],
    subPages: [
      { label: '台股全覽', path: '/analysis/explorer', summary: '市值樹圖與選股漏斗入口' },
      { label: '標籤選股', path: '/analysis/tags', summary: '用自訂標籤管理觀察名單' },
      { label: '市場總覽', path: '/analysis/overview', summary: '市場整體多空訊號儀表板' },
      { label: '排行榜', path: '/analysis/rankings', summary: '多指標排行，快速發現強勢個股' },
      { label: '行情', path: '/analysis/quote', summary: '個股完整行情資料中心' },
      { label: '技術分析', path: '/analysis/quote/technical', summary: 'K 線圖 + 技術指標' },
      { label: '法人買賣', path: '/analysis/quote/institutional', summary: '三大法人進出動向' },
      { label: '台積電分析', path: '/analysis/tsmc', summary: '深度個股範本：台積電基本面' },
      { label: '策略', path: '/strategy', summary: '選股策略管理與回測' },
    ],
    tips: [
      '先從排行榜看「今日強勢股」，再用 Scanner 全覽確認基本面是否支撐',
      '標籤可跨越產業分類，自由組合邏輯（如同時標記「半導體 + 高殖利率」）',
      '策略回測勝率 > 55% 且樣本數 > 30 次，才算有統計意義',
    ],
  },
  {
    id: 'trader',
    label: 'Trader',
    subtitle: '進場 · 委託下單與資金分配',
    iconColor: '#ef4444',
    path: '/trading/trader',
    summary:
      'Trader 是執行買入的操作介面。基於 Scanner 產出的候選清單，Trader 協助計算等權重分配金額，並直接透過 Shioaji API 發出市價或限價委託，同時顯示今日委託與成交狀態。',
    whenToUse: [
      '確認候選股後，執行實際買入動作',
      '需要同時分批布局多檔股票時，使用等權重計算',
      '查看今日委託狀態與成交回報',
      '需要查詢即時五檔報價再決定掛價',
    ],
    contexts: ['進場前'],
    features: [
      { label: '市價 / 限價委託', detail: '支援整股與零股下單' },
      { label: '等權重計算', detail: '輸入總資金，自動分配每檔金額' },
      { label: '五檔報價', detail: '即時顯示委買委賣，輔助決定掛價' },
      { label: '今日委託列表', detail: '已成交 / 委託中 / 取消狀態一覽' },
      { label: 'API 連線狀態', detail: '顯示 Shioaji 是否已成功登入' },
    ],
    tips: [
      '市場波動大時，建議用限價而非市價，避免以過高價格成交',
      '下單前先確認 Shioaji API 連線狀態（綠色 = 正常）',
    ],
  },
  {
    id: 'watchdog',
    label: 'Watchdog',
    subtitle: '監控 · 即時持倉盯盤與訊號偵測',
    iconColor: '#f97316',
    path: '/trading/watchdog',
    summary:
      'Watchdog 是持倉監控中心。即時顯示每一筆持股的浮動損益，並透過 Pipeline 面板呈現五個核心模組（Scanner / Trader / Watchdog / Exiter / Bookkeeper）的執行狀態，讓整個系統運作一目了然。',
    whenToUse: [
      '盤中或盤後確認每檔持倉的浮動損益',
      '確認是否有個股觸發出場條件（需搭配 Exiter）',
      '觀察整體投資組合的產業分配是否過度集中',
      '查看五模組 Pipeline 執行狀態，確認系統正常運作',
    ],
    contexts: ['持倉中'],
    features: [
      { label: '持倉明細', detail: '每股成本、現價、損益、報酬率即時更新' },
      { label: '帳戶摘要', detail: '總資產、今日損益、未實現損益' },
      { label: '產業配置', detail: '持股依產業分佈的比例圖' },
      { label: 'Pipeline 狀態', detail: '五模組即時執行狀態監控板' },
      { label: '警示訊號', detail: '個股觸發停損 / 停利條件時的視覺提醒' },
    ],
    subPages: [
      { label: '持倉', path: '/trading/watchdog', summary: '持股明細與帳戶摘要' },
      { label: 'Pipeline', path: '/trading/watchdog/pipeline', summary: '五模組執行狀態儀表板' },
    ],
    tips: [
      '每日收盤後對照持倉與排行榜，確認持股是否仍在強勢名單中',
      'Pipeline 若出現紅色警示，優先排查 Shioaji API 連線或資料更新問題',
    ],
  },
  {
    id: 'exiter',
    label: 'Exiter',
    subtitle: '出場 · 停損停利與一鍵平倉',
    iconColor: '#ec4899',
    path: '/trading/exiter',
    summary:
      'Exiter 負責管理出場邏輯。設定每檔持股的停損與停利條件，系統自動偵測觸發時機，並支援一鍵平倉。搭配 Watchdog 的即時盯盤，確保不會因情緒而拖延出場決策。',
    whenToUse: [
      '建立新部位後，立即設定停損 / 停利價格',
      '市場異常波動時，快速執行一鍵平倉降低曝險',
      '定期複核出場條件，確認是否需要調整止損位',
      '查看哪些持股已接近出場條件',
    ],
    contexts: ['出場時'],
    features: [
      { label: '停損設定', detail: '以百分比或絕對價格設定停損線' },
      { label: '停利設定', detail: '移動停利或固定目標價' },
      { label: '一鍵平倉', detail: '緊急情況下快速清空指定或全部持倉' },
      { label: 'Watchdog 訊號整合', detail: '接收 Watchdog 的觸發通知' },
      { label: '出場紀錄', detail: '每筆出場原因與時間戳記' },
    ],
    tips: [
      '進場時就設好停損，不要等到跌了再想',
      '停損線建議設在技術支撐破位 + 5%，而非隨意設固定比例',
    ],
  },
  {
    id: 'bookkeeper',
    label: 'Bookkeeper',
    subtitle: '記帳 · 交易統計與績效分析',
    iconColor: '#14b8a6',
    path: '/trading/bookkeeper',
    summary:
      'Bookkeeper 是交易紀錄與績效分析中心。自動彙整所有成交紀錄，計算勝率、獲利因子、Sharpe Ratio 等核心 KPI，並繪製權益曲線，幫助你客觀評估操盤系統的長期表現。',
    whenToUse: [
      '每週或每月定期審視交易績效，找出改善點',
      '評估某個策略或選股方法的歷史表現',
      '計算年化報酬與最大回撤，評估風險報酬比',
      '複盤哪些出場是情緒決策，哪些是系統訊號',
    ],
    contexts: ['事後複盤'],
    features: [
      { label: '交易紀錄', detail: '所有成交的時間、股票、成本、獲利明細' },
      { label: 'KPI 儀表板', detail: '勝率、獲利因子、平均盈虧比' },
      { label: '權益曲線', detail: '累計報酬隨時間的視覺化折線圖' },
      { label: 'Sharpe Ratio', detail: '風險調整後報酬，評估策略穩定性' },
      { label: 'Sortino / Calmar', detail: '下行風險與最大回撤的進階風險指標' },
    ],
    subPages: [
      { label: '交易紀錄', path: '/trading/bookkeeper', summary: '所有成交明細一覽' },
      { label: '報表', path: '/trading/bookkeeper/report', summary: 'KPI + 權益曲線 + 風險指標' },
    ],
    tips: [
      '勝率不是最重要的，獲利因子（Profit Factor > 1.5）才是持續獲利的關鍵',
      '最大回撤超過 20% 通常意味著倉位或停損設定需要調整',
    ],
  },
  {
    id: 'workflow',
    label: 'Workflow',
    subtitle: '操盤 SOP · 從研究到復盤的完整流程',
    iconColor: '#22c55e',
    path: '/analysis/workflow',
    summary:
      'Workflow 是操盤 SOP 的執行載體，涵蓋賽道篩選、財務分析、看板管理、下單前檢查清單、交易日誌到每月復盤，確保每一次操作都有標準流程可依循，降低情緒干擾。',
    whenToUse: [
      '週末研究時：走賽道漏斗 + 財務篩選，建立候選清單',
      '下單前：執行 SOP 清單確認所有條件符合',
      '交易後：記錄日誌，包含進場理由與風險評估',
      '月底：跑每月復盤，統計勝率與找出規律',
    ],
    contexts: ['選股階段', '進場前', '事後複盤'],
    features: [
      { label: '賽道漏斗', detail: '從宏觀 Top-Down 篩選強勢類股' },
      { label: '財務篩選', detail: '手動輸入 EPS、ROE、本益比等指標分析' },
      { label: '看板', detail: '拖曳式股票狀態管理（觀察 / 準備 / 持倉）' },
      { label: 'SOP 清單', detail: '下單前 / 後的標準化檢查清單' },
      { label: '交易日誌', detail: '記錄每筆交易的進出理由與情緒狀態' },
      { label: '每月復盤', detail: '月度績效統計 + 自我檢討筆記' },
    ],
    subPages: [
      { label: '賽道漏斗', path: '/analysis/workflow/funnel', summary: '宏觀選股漏斗，從類股縮小到個股' },
      { label: '財務篩選', path: '/analysis/workflow/fundamental', summary: '手動財務指標分析' },
      { label: '看板', path: '/analysis/workflow/kanban', summary: '拖曳式股票狀態管理' },
      { label: 'SOP 清單', path: '/analysis/workflow/checklist', summary: '下單前後的標準檢查清單' },
      { label: '交易日誌', path: '/analysis/workflow/journal', summary: '每筆交易的進出記錄' },
      { label: '每月復盤', path: '/analysis/workflow/review', summary: '月度績效複盤與分析' },
    ],
    tips: [
      '每次交易日誌一定要記「為什麼進場」，而不只是「哪天買了什麼」',
      '看板的「準備」欄位是最重要的，代表你已研究完成但在等待入場時機',
      '復盤時重點看「停損出場」的案例，找出是否有系統性誤判',
    ],
  },
  {
    id: 'notes',
    label: '筆記專區',
    subtitle: '知識庫 · 個人投資筆記與策略記錄',
    iconColor: '#f59e0b',
    path: '/analysis/notes',
    summary:
      '筆記專區是個人知識庫，支援 Markdown 格式的自由撰寫。記錄選股心法、產業研究、個股分析或任何投資心得，內建分類與標籤系統，方便日後快速查找。',
    whenToUse: [
      '研究完一個產業或個股後，記錄重點與結論',
      '想保存某個操盤心法或策略邏輯',
      '記錄市場觀察或宏觀判斷',
      '整理已讀過的財報或法說會重點',
    ],
    contexts: ['日常輔助'],
    features: [
      { label: 'Markdown 編輯', detail: '支援標題、粗體、清單、程式碼區塊等格式' },
      { label: '分類管理', detail: '學習概念 / 選股策略 / 產業研究 / 個股筆記 / 操盤日誌 / 其他' },
      { label: '標籤系統', detail: '自訂標籤，可跨分類快速篩選' },
      { label: '搜尋', detail: '全文搜尋筆記標題與內容' },
      { label: '置頂', detail: '重要筆記可置頂，每次開啟優先顯示' },
      { label: 'CRUD 操作', detail: '新增、編輯、刪除，即時儲存' },
    ],
    tips: [
      '每篇筆記保持單一主題，比大雜燴式筆記更容易之後搜尋到',
      '標籤可以用股票代號（如「2330」），方便跨筆記查一檔股票的所有記錄',
    ],
  },
  {
    id: 'guide',
    label: '教學指南',
    subtitle: '術語字典 · 投資名詞快速查詢',
    iconColor: '#14b8a6',
    path: '/guide',
    summary:
      '教學指南是投資術語的字典，涵蓋市場指數、報價明細、行情分析、帳戶持倉、交易操作、設定與 API 等六大類別，共 80+ 個詞條。適合剛接觸台股或 Shioaji API 的使用者查閱。',
    whenToUse: [
      '看到不熟悉的指標或名詞時，快速查詢說明',
      '剛開始使用系統，想了解各欄位含義',
      '確認技術分析術語的精確定義',
    ],
    contexts: ['日常輔助'],
    features: [
      { label: '關鍵字搜尋', detail: '同時搜尋術語名稱與說明文字' },
      { label: '類別篩選', detail: '依市場指數、報價、技術分析等分類瀏覽' },
      { label: '80+ 詞條', detail: '涵蓋台股操盤所需的核心術語' },
      { label: 'API 術語', detail: '包含 Shioaji 相關的設定與連線術語' },
    ],
    tips: [
      '遇到不懂的詞，先在這裡查。查不到再 Google 或問 AI',
    ],
  },
]

export const featureGuideMap = Object.fromEntries(
  featureGuideModules.map(m => [m.id, m]),
)
