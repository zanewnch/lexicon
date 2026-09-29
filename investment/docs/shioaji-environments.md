# Shioaji 模擬與正式環境設計

> 本文件整理本 repo 的 Shioaji 環境選擇與正式交易前置條件。環境旗標只決定 SDK 連到哪種環境，不代表券商已授予該 API Key 或帳戶正式交易權限。官方流程可能調整；申請、簽署與審核狀態以永豐及 Shioaji 管理介面顯示為準。

## 先看結論：多個獨立條件

正式交易至少牽涉下列不同層次，需逐項成立且彼此不能替代：

1. **程式環境選擇**：`sj.Shioaji(simulation=False)` 指定 SDK 使用正式環境。
2. **API Key 設定**：該 Key 的 `Trading` 權限及 `Production Environment` 必須允許正式交易；Key 也可能受有效期限、可用帳戶及 IP allowlist 約束。行情／帳務功能另受 `Market/Data`、`Account` 權限影響。
3. **CA 憑證**：依券商流程申請／下載、妥善保管，並在正式連線時成功啟用。單有 `.pfx` 檔案不代表已完成申請、有效、密碼正確或已成功啟用。
4. **正式 API 文件與資格流程**：依適用商品完成 API 文件簽署；官方要求先在模擬環境完成登入及下單測試並經審核。股票與期貨需分別處理／測試。
5. **帳戶 `signed` 狀態**：正式登入後檢查回傳的各帳戶狀態，並確認欲使用的正確商品帳戶已簽署。登入成功本身不等於正式下單資格已完成。
6. **本系統授權**：任何可能送出真實委託的操作，仍須使用者明確授權。環境及券商資格就緒不構成操作授權。

因此，**切換正式模式或只有 `.pfx` 都不代表已有正式交易權**。正式送單應在以上券商條件與本系統使用者授權均確認後才可能執行。

## Shioaji `simulation` 參數

- `simulation=True`：SDK 使用模擬環境，供熟悉 API 與測試流程；可用 API 及帳務資料與正式環境不同。官方列出模擬下單不支援興櫃及零股。
- `simulation=False`：SDK 使用正式環境。這是連線目標選擇，不會自行替 API Key 開通權限、簽署文件、申請／啟用 CA 或完成帳戶簽署審核。
- 模擬環境亦可能呼叫模擬 `place_order`。這不是真實券商委託；但 repo 的一般自動化測試不得呼叫券商下單 API（包括模擬環境），以免測試依賴券商、改變帳戶測試狀態或產生外部副作用。券商要求的正式資格模擬測試是獨立人工辦理流程，不屬於 repo 測試套件。

參考官方[模擬模式說明](https://sinotrade.github.io/zh/tutor/simulation/)。

## 券商端的 API Key 權限

API Key 管理頁建立 Key 時可設定有效期限、可用權限、可用帳戶、是否可用於正式環境，以及允許 IP 清單。官方權限欄位的意義：

| 券商設定 | 控制範圍 | 注意事項 |
|---|---|---|
| `Market / Data` | 行情／資料 API | 不等同帳務或交易權限 |
| `Account` | 帳戶相關 API | 與交易權限分開設定 |
| `Trading` | 交易相關 API | 下單及官方模擬下單測試需有此權限；並非單獨足以啟用正式交易 |
| `Production Environment` | 此 Key 能否用於正式環境 | 必須符合正式連線需求；程式的 `simulation=False` 不會替 Key 開啟此權限 |
| 可用帳戶、有效期限 | Key 能使用的帳戶範圍與期限 | 需涵蓋目標帳戶，且 Key 未過期 |
| IP allowlist | Key 允許連線的來源 IP | 執行環境來源 IP 必須符合清單；官方建議限制來源 IP |

Secret Key 只在 API Key 建立成功時顯示一次，官方表示之後無法再次取得。此 repo 依目前使用者決定追蹤設定檔；文件、日誌、截圖與測試輸出只記錄設定是否存在，不輸出實際值。若遺失，依券商管理頁的現行流程處理，不要將假設的重新顯示能力寫入系統設計。

細節以官方[Token 與憑證申請說明](https://sinotrade.github.io/tutor/prepare/token/)為準。

## CA 憑證申請與啟用

正式下單前需完成 CA 申請並啟用。一般流程是依永豐提供的方式申請／下載憑證，安全保存檔案及其密碼，在正式登入後呼叫 Shioaji `activate_ca`，並確認呼叫成功。正式模式通常需要 CA 路徑、CA 密碼及身分識別資料；模擬登入可不啟用 CA。

- `.pfx` 是敏感憑證。整合到 Lexicon 後只存放在本機投資資料目錄，不納入新專案的 Git 或安裝包；文件與範例僅使用 `<CA_FILE_PATH>`、`<CA_PASSWORD>`、`<PERSON_ID>` 等假佔位符。
- 檔案存在只是本機檢查，不代表憑證已申請到正確帳戶、未過期、密碼正確或 `activate_ca` 成功。
- CA 啟用也不替代 API Key 的正式環境／交易權限、正式文件簽署、測試審核或帳戶 `signed` 狀態。

## 正式 API 文件、模擬測試與審核

官方說明指出，正式環境使用前需簽署適用的 API 文件，並在模擬模式完成 API 測試及測試報告審核。股票與期貨簽署及測試需分別完成。官方目前文件要求測試前先簽署相關文件，並以有 `Trading` 權限的 Key 進行模擬登入／下單測試；審核狀態可在簽署中心查詢。實際服務時間、測試要求與審核結果應以官方頁面及帳戶當下狀態為準。

> **安全界線：** repo 自動化測試、開發驗證、CI 與一般操作驗證不得送出任何券商真實委託。官方要求的模擬資格測試若需下單，必須明確使用模擬環境並由帳戶持有人依官方流程另行操作；不得把測試切到正式模式。任何真實下單必須先取得使用者明確授權，不能由自動測試、啟動程序、預設值或模式切換隱含授權。

參考官方[API 文件簽署與測試](https://sinotrade.github.io/tutor/prepare/terms/)及[服務條款／CA 說明](https://sinotrade.github.io/tutor/terms/)。

## 正式帳戶 `signed` 狀態

Shioaji 官方流程要求以正式模式登入並檢查登入回傳的帳戶資料 `signed` 欄位。應逐一確認實際要使用的股票或期貨帳戶狀態；若適用商品帳戶未完成簽署／審核，應停止正式下單並回到券商端確認。股票與期貨狀態不可互相推定。

本 repo 的 `backend/account/service.py` 會在正式送單前檢查股票帳戶的 `signed` 欄位；若不是明確的 `True` 就拒絕。連線成功與 CA 啟用仍不能替代券商端的權限、簽署與審核確認。官方查核方法見[API 測試及帳戶狀態說明](https://sinotrade.github.io/tutor/prepare/terms/)。

## 本 repo 目前設定結構

設定載入在 `backend/core/shioaji.py` 的 `ShioajiConnection._load_credentials()`：

| 設定 | 目前來源／行為 |
|---|---|
| 預設模式 | `credentials.json` 的 `default_mode`；未提供時預設 `simulation`。只接受 `simulation` 或 `production`，其他值拒絕連線 |
| 模擬 Token 區塊 | `credentials.json` 的 `shioaji_simulation.api_key`、`shioaji_simulation.api_secret` |
| 正式 Token 區塊 | `credentials.json` 的 `shioaji_formal.api_key`、`shioaji_formal.api_secret` |
| 模式覆寫 | `SHIOAJI_SIMULATION`；只接受 `true` 或 `false`（忽略大小寫），其他值拒絕連線 |
| Key 覆寫 | `SHIOAJI_API_KEY`、`SHIOAJI_API_SECRET`；環境變數優先於目前模式區塊 |
| CA 設定 | 共用的 `ca_path`、`ca_passwd`、`person_id`，可由 `SHIOAJI_CA_PATH`、`SHIOAJI_CA_PASSWD`、`SHIOAJI_PERSON_ID` 覆寫；預設憑證檔名為專案根目錄下的 `Sinopac.pfx` |
| SDK 初始化 | `sj.Shioaji(simulation=self.simulation_mode)`，登入後正式模式呼叫 `activate_ca(...)` |
| 正式連線開關 | `SHIOAJI_ENABLE_PRODUCTION_CONNECTION=true` 才允許正式連線；預設關閉 |
| 正式送單開關 | `SHIOAJI_ENABLE_LIVE_TRADING=true` 才允許正式送單；預設關閉，並另驗證股票帳戶 `signed` 與 Trade PIN |
| 交易密碼 | `SHIOAJI_TRADE_PIN` 或 `credentials.json` 的 `trade_pin`；未設定、讀取失敗或不符合時，券商模擬與正式送單都拒絕 |
| 模式切換 | `/api/system/mode/` 的 `simulation` 欄位必須是 JSON 布林值；切換僅改變券商連線目標，不會執行委託 |

## 三種交易紀錄與驗證

- **紙上交易**：Trader/Exiter 只寫本機資料庫，無券商委託；可用隔離測試資料庫完整驗證進場、停損停利、出場與報表。
- **券商模擬**：`simulation=True` 且明確選擇 `broker_simulation`；須設定 Trade PIN、明確確認每次委託。實際 `place_order` 會改變券商模擬帳戶狀態，repo 自動化測試只使用 mock。
- **正式交易**：`simulation=False` 且明確選擇 `broker_production`；還須開啟兩個正式環境開關、啟用 CA、檢查股票帳戶 `signed`、設定 Trade PIN，並完成券商端資格流程。程式開關不代表券商已核准。

三種紀錄以 `venue` 區分；持倉、出場訊號、風控統計與復盤報表按環境查詢。券商委託只建立待送出紀錄；收到已確認成交後才建立或調整持倉及損益。部分成交按每筆 deal 累加；回呼的 `exchange_seq` 與補查清單的 `deal.seq` 分別去重，再依成交數量、價格與時間比對同一筆成交。無法可靠比對時停止自動補帳並記錄錯誤日誌，須人工核對。若回呼中斷，可在 `backend/` 執行 `python manage.py reconcile_broker_orders` 查詢券商當日委託並補入已確認成交；該命令不送出委託，若仍有未對齊的本機委託會回報錯誤與委託 ID。

補查快照已記帳後，若稍晚回呼的數量、價格相同且時間相差不超過一秒，但無法以精確時間確認是同一筆，回呼會先停下交由券商快照再核對，避免時間戳精度差異造成重複入帳。隔離測試亦確認相隔較久的另一筆成交仍可入帳；實際券商回呼與快照時間精度尚待真實成交驗證。

2026-09-27 實測：台積電 2330 的券商模擬限價單與策略市價單均已送出、查到券商受理、取消並查到已取消；策略單 `000015` 對帳後為已取消、成交 0 股、無本機模擬持倉。SDK 1.7.6 的實際委託／取消回呼內容是具有 `items()` 的 `OrderEventDict`，已修正解析方式，並以模擬單 `00001A` 驗證能讀取委託編號、帳戶、識別碼及新增／取消事件；該單取消後對帳顯示 0 筆未解決。這些紀錄證明送單、查單、取消與取消對帳流程；因未成交，券商實際成交回呼、部分成交及賣出流程仍待模擬環境產生成交後驗證。自動化測試以 SDK 事件列舉及映射型回報替身覆蓋這些分支，不能取代實際券商成交驗證。

交易頁已用實際券商模擬資料驗證委託時間、限價／市價種類及快照最佳買賣價。Shioaji `snapshots` 的 `buy_price`、`sell_price` 是單一最佳價；交易頁只有收到既有 `/ws/market/<code>/` 的 `bidask` 串流後才顯示「五檔報價」，休市快照只顯示真實最佳一檔，不推算其餘檔位。休市期間尚無即時五檔事件可供實測。驗證期間產生的五筆 2330 候選已核對僅關聯零成交、已取消的券商模擬委託，並透過 `/api/scanner/candidates/discard-cancelled/` 清除候選；委託稽核紀錄仍保留，原有 2454 候選保留。

2026-09-27 啟動後發現本機資料庫尚未套用 `learning.0001_initial`；檢查內容只有新增 `LearningProgress` 資料表後已執行 migration，`migrate --plan` 顯示無待套用項目，`/api/learning/progress/` 可正常讀取。模擬模式重新連線時，已實測 2454 的現有 WebSocket 訂閱會移到新的 Shioaji 連線，券商回報 Tick 與 BidAsk 訂閱成功；休市無實際報價事件，正式模式切換尚未實測。

單筆下單 API 現在會先建立含六碼 `custom_field` 的本機委託，再送往券商；確認成交才記入持倉與損益。單筆賣出必須能對應一筆足額且沒有其他未完成賣單的本機持倉，否則拒絕，以免券商成交後無法對帳。2026-09-27 另以交易頁同一支單筆下單 API 送出 2330 模擬限價買單 `00001C`：券商回報受理，本機建立 `P00006` 待送出委託；取消後券商與本機均為已取消、成交 0 股，`reconcile_broker_orders` 回報未解決委託 0 筆。實際成交入帳與賣出仍只由隔離測試中的模擬回呼覆蓋，待券商模擬成交事件驗證。

送單逾時等結果不明情況會保留本機 `pending` 委託，禁止當作失敗單重送。後續對帳若取得相符的券商委託編號與 `Submitted`／`PreSubmitted` 狀態，會補齊編號並改為 `submitted`；股票、方向、交易單位或編號不符時則回報未解決委託 ID，不會宣稱對帳完成。此分支目前由隔離測試覆蓋，尚未刻意製造實際券商逾時。

現在每次建立 Shioaji 連線後都會註冊成交回呼，包含重連且尚未再送新單的情況；本機模擬登入已確認回呼綁定新 API。取消回呼若與本機委託編號衝突，或對帳快照的委託張數與本機不符，會停止該筆自動更新並要求人工核對。這些異常分支由隔離測試驗證，未對券商刻意製造不一致資料。

新券商委託在送出前會對股票帳戶執行 `update_status`，再檢查 Shioaji 1.7.6 的 `trade_cache_health`；只有 `Healthy`，或單純尚無回報基準的 `Unknown / NoBaseline`，才允許繼續。回報漏接、未訂閱或狀態無法查明時拒絕新委託；取消操作仍可進行。2026-09-27 實際模擬帳戶在剛登入時為 `Unknown / NoBaseline`，刷新後為 `Healthy`，且下單前檢查已以唯讀方式驗證。這表示回報監測可用，不能據此推定模擬委託已成交。官方說明見 [Update Status 與 Trade Cache Health](https://sinotrade.github.io/tutor/order/UpdateStatus/)。

模擬帳戶的持倉與投資組合摘要現在讀取本機已確認的 `broker_simulation` 成交持倉，依股票合併數量與成本，並以 Shioaji 快照收盤價計算參考市值及未實現損益。若任一報價不可用，相關市值與損益回傳 `null`，畫面顯示 `---`；模擬現金、總資產及今日損益沒有可靠帳務來源，也維持未知。這是本機已對帳成交紀錄的視圖，不等於券商正式帳戶餘額。2026-09-27 唯讀呼叫模擬 `list_positions` 回傳 0 筆，本機亦無已成交持倉；有持倉時的顯示目前由隔離測試驗證，仍待實際模擬成交後核對。

上表描述 schema 與程式行為，不記錄實際 Key、密碼或憑證內容。整合到 Lexicon 後，`credentials.json`、`.env` 與 `Sinopac.pfx` 放在本機投資資料目錄，未加入新專案或安裝包。

## 後續正式上線檢查

以下事項需要在正式交易前按實際帳戶與部署環境確認：

1. 以帳戶持有人身分依官方流程完成簽署、模擬登入與模擬下單測試，以及審核確認；這不能由 mock 測試代替。
2. 正式 Key 的 `Trading`、`Production Environment`、帳戶範圍、期限與來源 IP 限制，須在券商介面逐一核對。
3. 對實際交易帳戶確認 CA 啟用結果與 `signed=True`；在正式委託前先執行委託狀態對帳，處理未知或未完成的舊單。
4. 正式模式不應使用開發伺服器對外提供 API；應有存取控制、秘密管理、備份、監控及可恢復的委託對帳作業。
5. 自動化測試維持 mock／fake，不對券商送單；實際券商模擬委託另由帳戶持有人明確安排。

## 官方參考

- [Token 與憑證申請](https://sinotrade.github.io/tutor/prepare/token/)
- [API 文件簽署與模擬測試](https://sinotrade.github.io/tutor/prepare/terms/)
- [服務條款、測試報告與 CA](https://sinotrade.github.io/tutor/terms/)
- [模擬模式及支援 API](https://sinotrade.github.io/zh/tutor/simulation/)
