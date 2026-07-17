# YouTube Chrome Extension 整合

## 使用與發行

開發版 Extension 位於 `extensions/youtube/`，以 Vue + Vite + CRXJS 開發。它內含固定 public key，因此在 Chrome 開發人員模式載入時，ID 固定為 `beihelddlfklfpemplilnfhcffcjgdkp`。

Windows：

```powershell
npm run native-host:build
.\tools\youtube\register-native-host.ps1 -NativeHostPath .\native-host\publish\win-x64\LexiconNativeHost.exe
```

macOS：執行 `npm run native-host:build:mac` 後啟動 Lexicon；App 會把 Chrome manifest 註冊到使用者目錄。

在 `extensions/youtube/` 執行 `npm run dev`。WXT 會自動開啟一個已載入開發版 Extension 的 Chrome 視窗；Lexicon 必須先啟動且模型就緒。變更 `wxt.config.ts` 時需重啟開發伺服器。[WXT 文件](https://wxt.dev/guide/installation.html)

`npm run youtube:build` 可產生 production Extension；`npm run package` 與 `npm run package:mac` 分別建置 Windows 與 macOS 安裝產物。Chrome Web Store 發行後，需把正式 ID 加入兩平台的 host manifest 白名單。

## 目標

Lexicon 以本機 Gemma 模型協助閱讀 YouTube 英文字幕，不將字幕或翻譯內容送往雲端。支援 Windows、macOS 與 Google Chrome，支援 YouTube 可取得的英文人工字幕與自動產生字幕；不自行對影片音訊做語音辨識。

提供三種互補的閱讀方式：

| 情境 | 呈現位置 | 行為 |
|---|---|---|
| 觀看影片 | YouTube 播放器 | 在英文字幕下方顯示繁中即時翻譯。 |
| 快速查句 | 既有 Lexicon popup | 點擊字幕或按目前設定的快捷鍵，查看目前句的完整翻譯。 |
| 深度閱讀 | Lexicon 主視窗 | 點擊 Extension 圖示，閱讀完整逐字稿、時間戳與逐段翻譯。 |

## 架構與責任

```text
YouTube content script
        ↕ chrome.runtime.Port
Extension service worker
        ↕ chrome.runtime.connectNative()
Native Messaging Host
        ↕ local IPC
Lexicon main process / TranslationEngine
        ↕
Extension overlay、Lexicon popup、Lexicon 主視窗
```

- **Content script**：僅在 `https://www.youtube.com/*` 執行，偵測字幕 DOM 的變化、取得逐字稿，並繪製不遮擋原始字幕的翻譯 overlay。
- **Service worker**：維持與 native host 的長連線，轉送 Extension 內部訊息與 host 回應。Chrome 的 Port 使用 JSON 可序列化資料；不可把 DOM 或函式直接放進訊息。[Chrome 訊息傳遞文件](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- **Native Messaging Host**：隨 Lexicon 安裝產物提供的獨立 bridge。負責 Chrome 的 stdin/stdout 長度前綴 JSON 協議，以及與既有 Lexicon 執行個體的本機 IPC；不執行翻譯。
- **Lexicon**：驗證 bridge 傳入內容、使用既有 `TranslationEngine.translate()` 翻譯、維護目前字幕與逐字稿的請求優先順序，並將結果回傳。

## Extension 與安裝

Extension 採 Manifest V3，權限只包含 `https://www.youtube.com/*` 與 native messaging 所需權限；不得使用廣泛網站權限。

Native host manifest 使用名稱 `com.lexicon.youtube`，並設定為 `stdio`。Windows 安裝程式將 host manifest 放入 Lexicon 安裝目錄，並建立：

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.lexicon.youtube
```

Registry 預設值為 host manifest 的絕對路徑。解除安裝時移除這個 key 與 host manifest。Chrome 只允許 manifest `allowed_origins` 中列出的 Extension ID 連線，且不支援 wildcard。[Chrome Native Messaging 文件](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

macOS 由 Lexicon 啟動時建立：

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.lexicon.youtube.json
```

它指向與目前 CPU 架構相符的 bundled native host；host 與 Lexicon 間使用 Unix domain socket。

同一份 host manifest 要列出兩組固定 ID：

| 發行方式 | ID 來源 | 用途 |
|---|---|---|
| 開發版 | Extension manifest 的固定 `key` 衍生 | 開發人員模式載入時維持穩定 ID。 |
| 正式版 | Chrome Web Store 發行後取得 | 使用者從商店安裝時連線。 |

正式上架前不得在文件或 host manifest 以猜測值取代正式 Extension ID；發行流程必須將該 ID 注入安裝產物。

## 訊息協議

所有訊息皆為 JSON 物件，必須驗證 `type`、字串長度、影片 ID、序號與時間範圍。bridge 對不在白名單中的來源、未知 `type`、空白字幕與超過限制的訊息回傳錯誤，不轉交 Lexicon。

| 類型 | 方向 | 必填欄位 | 用途 |
|---|---|---|---|
| `caption:update` | Extension → Lexicon | `videoId`, `sequence`, `startMs`, `endMs`, `text` | 目前顯示的英文字幕。 |
| `caption:translated` | Lexicon → Extension | `videoId`, `sequence`, `translation` | 對應即時字幕的繁中翻譯。 |
| `caption:error` | Lexicon → Extension | `videoId`, `sequence`, `code`, `message` | 模型未就緒或翻譯失敗。 |
| `transcript:open` | Extension → Lexicon | `videoId`, `title`, `language`, `segments` | 使用者要求開啟完整逐字稿。 |
| `transcript:progress` | Lexicon → Extension | `videoId`, `completed`, `total` | 背景翻譯進度。 |
| `transcript:segment` | Lexicon → Extension | `videoId`, `segmentId`, `translation` | 單一逐字稿段落的譯文。 |
| `transcript:error` | Lexicon → Extension | `videoId`, `code`, `message` | 無字幕、字幕受限或無法開啟閱讀頁。 |

`transcript:open` 的 `segments` 每段包含 `id`、`startMs`、`endMs` 與 `text`。Extension 以最多 100 段為一批傳送；Lexicon 每次送入模型的字幕群組不得超過 900 個英文字符。這避免 Native Messaging 訊息過大，也讓既有模型 context 可穩定處理。

## 即時字幕流程

1. content script 以 `MutationObserver` 觀察 YouTube 字幕容器，擷取目前英文字幕與影片 ID。
2. 相同的 `videoId`、字幕文字與時間範圍不重送；變更後等待 250ms 才送出，合併播放器 DOM 的短暫更新。
3. Lexicon 優先翻譯最新的 `caption:update`。結果回傳時，Extension 只接受與目前 `videoId` 和 `sequence` 相同的 `caption:translated`。
4. 模型處理期間保留 YouTube 原始英文字幕；翻譯到達後才顯示第二行繁中字幕。不得隱藏、修改或阻擋 YouTube 自帶字幕。
5. 暫停、跳轉或切換影片時，content script 遞增序號並清除 overlay；舊請求可完成但不得覆蓋新字幕。

## 完整逐字稿閱讀流程

1. 使用者點 Extension 圖示的「閱讀完整逐字稿」。Extension 取得該影片可用的英文時間軸字幕；沒有字幕時回報「此影片沒有可取得的英文字幕」。
2. Extension 傳送 `transcript:open`，Lexicon 立即開啟或聚焦主視窗，先顯示完整英文逐字稿、標題與時間戳。
3. Lexicon 在背景逐段翻譯，優先順序為目前播放位置附近段落、主視窗可視區段、剩餘段落。
4. 每段完成就更新對應譯文與 `transcript:progress`；原文始終可閱讀，不等待全文翻譯完成。
5. 換影片或關閉閱讀頁時取消尚未開始的背景工作；已完成段落可留在目前頁面，不寫入長期資料庫。

## 失敗處理

| 情況 | Extension 顯示 | Lexicon 行為 |
|---|---|---|
| Lexicon 未啟動或 bridge 未安裝 | 「找不到 Lexicon。請先啟動或重新安裝 Lexicon。」 | 不重試啟動程式。 |
| 模型下載中或未就緒 | 「Lexicon 模型載入中。」 | 保留英文字幕，不佇列過期即時字幕。 |
| 影片沒有英文字幕 | 「此影片沒有可取得的英文字幕。」 | 不開啟空白逐字稿頁。 |
| 字幕受限或格式變更 | 「無法讀取此影片字幕。」 | 記錄可診斷錯誤，不影響播放。 |
| 訊息格式或大小不合法 | 「字幕資料無效。」 | bridge 拒絕訊息並中斷該請求。 |

## 驗證

- 手動字幕與自動產生英文字幕均可顯示原文與繁中第二行，重複 DOM 更新不造成閃爍或重複翻譯。
- 快速拖曳時間軸、暫停、恢復與切換影片時，不顯示舊影片或舊序號的翻譯。
- 開啟完整逐字稿後，英文全文立即可讀；翻譯會依播放位置與可視區段優先完成。
- 開發版與 Chrome Web Store 正式版皆能連線；非 `allowed_origins` 的 Extension 會被 Chrome 拒絕。
- bridge 未安裝、模型未就緒、無字幕、訊息過大與連線中斷時，錯誤可理解，且 YouTube 原始播放與字幕不受影響。
