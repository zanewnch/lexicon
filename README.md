# Unus

## 統一工作區

Unus 使用同一套側邊欄與主介面整合台股投資、翻譯、今日學習、YouTube 逐字稿、雅思練習、搜尋紀錄與英文新聞。設定頁包含「一般設定」「個人資料」「英文平台」分頁；模型、快捷鍵與備份在英文平台分頁，外觀由全系統共用的一般設定管理。

桌面和瀏覽器共用本機服務及資料。啟動 Unus 後，系統匣的「在瀏覽器開啟」會開啟同一套網站。英文模型、學習與原生對話框服務需 Unus 正在運行。完全結束 Unus 時會清理 Django、英文本機服務和開發版 Vite；快捷翻譯 popup、YouTube Extension 與首次模型設定繼續運作。

Unus 沿用既有的 `lexicon` 使用者資料目錄；英文 SQLite、模型與其下 `investment/` 投資資料保持原位置，無須搬移。英文頁面使用 `/english/` 路由，投資路由保持相容。

## Agent 技能

本 repo 的 `AGENTS.md`、`CLAUDE.md`、`.codex/`、`.claude/` 等入口連至 `own_harness_engineering/profiles/lexicon/`。共用技能由 `harness-core` plugin 提供；投資的架構、術語、策略研究與課程技能沿用同一份 `harness-finance` plugin，投資程式路徑以本 repo 的 `investment/` 為根。Unus profile 關閉 `harness-ia`。本機 Claude 許可設定保留在 profile 的 `.claude/settings.local.json`，由原入口連結讀取，不納入 Git。

首次啟動會尋找 `Documents/GitHub/investment`，或 `LEXICON_INVESTMENT_LEGACY_ROOT` 指定的舊專案，並在 Unus 使用者資料目錄下建立 `investment/`。若找到舊資料庫，會以 SQLite 備份 API 搬遷資料庫並核對完整性和每張表的筆數，同時複製策略、舊筆記快照、媒體與本機設定；舊專案保持原狀。若找不到舊資料，則建立新資料庫。要從其他路徑搬遷，請在第一次啟動前設定 `LEXICON_INVESTMENT_LEGACY_ROOT`。

投資資料目錄內的 `investment.sqlite3`、`strategies.json`、`seedNotes.json`、`media/`、`.env`、`credentials.json` 和 `Sinopac.pfx` 是本機資料，未納入安裝包或 Git。交易仍須經過原本的模擬／正式環境、Trade PIN 與正式交易開關。網站只監聽 `127.0.0.1`；依目前使用偏好，沒有額外的登入密碼。

若首次搬遷需要回復：完全結束 Unus，將使用者資料目錄下的 `investment/` 改名保留，再啟動 Unus 重新從原 investment 專案匯入。匯入程式不會修改舊專案；重匯入前先核對舊專案資料是否仍為預期版本。不要在投資服務運作時替換 SQLite 檔案。

若在設定中啟用「關閉 App 時自動備份」，Unus 會在所選資料夾建立英文資料庫備份與 `investment-backup-.../`；後者包含投資 SQLite、策略、媒體與本機交易設定。從備份回復時，先完全結束 Unus，將現有 `investment/` 改名保留，再把整個 `investment-backup-.../` 複製為使用者資料目錄下的 `investment/`。備份含本機憑證，請妥善保管所選資料夾。

開發版首次使用需在 repo 根目錄執行 `npm install`，在 `investment/frontend` 執行 `npm ci`，並為 Python 安裝 `investment/backend/requirements.txt`。`npm run dev` 會啟動桌面以及統一前端的 Vite，主頁不需要事先 build。打包版由 `npm run package`（Windows）或 `npm run package:mac`（macOS）編入投資前端與 Python 服務；建置機需先安裝 `investment/backend/requirements-build.txt`。macOS 安裝包需在對應的 macOS 架構上建置與驗證。

Notes CLI 在開發環境沿用 `python investment/backend/manage.py notes_cli ...`；設定 `LEXICON_INVESTMENT_DATA_DIR` 為 Unus 使用者資料目錄下的 `investment/`，即可讀寫與桌面、瀏覽器相同的筆記。安裝版的 `investment-service` 執行檔也支援 `notes_cli` 子命令，須傳入相同資料目錄環境變數。

Unus 是以桌面為中心的本機個人平台，目前整合翻譯、英文學習、IELTS 練習、資訊整理與投資工作區。Windows 選取文字後按下 `Ctrl+Shift+Q`，或 macOS 按下 `⌘⇧L`，會在游標附近開啟小視窗並自動翻譯；沒有選取文字時，視窗會直接提供輸入框。

## 目前功能

- Windows `Ctrl+Shift+Q`／macOS `⌘⇧L` 全域快捷鍵（可在設定中更改）
- Windows 與 macOS 自動取得選取文字，並還原原本的文字剪貼簿
- 游標附近 popup，點擊外部或按 `Esc` 關閉
- 沒有選取文字時直接輸入繁體中文
- 本地 Gemma 4 E2B GGUF 翻譯，不需要 API key
- 新聞工作區：搜尋即時新聞、開啟原文，並以本機 Gemma 4 根據來源摘要整理重點
- 推理 backend 依序嘗試 Metal（Apple Silicon）→ CUDA（NVIDIA）→ Vulkan（Intel/AMD 等相容 GPU）→ CPU
- 目前 `node-llama-cpp` GGUF runtime 沒有 NPU backend，因此 NPU 不會被誤報為已使用
- Setup Wizard 從 Hugging Face 下載模型並驗證 SHA256
- Windows NSIS installer 與 macOS DMG／ZIP 打包

## 使用方式

1. 啟動 Unus。
2. 第一次啟動時，在 Setup Wizard 下載 Gemma 4 E2B 模型（約 2.29 GB）。
3. 在任何程式選取文字，Windows 按 `Ctrl+Shift+Q`；macOS 按 `⌘⇧L`。
4. 沒有選取文字時，按快捷鍵後直接在 popup 輸入內容。
5. 在主視窗選擇「新聞」，可輸入關鍵字搜尋即時新聞；選擇一則報導後可閱讀原文或產生本機 AI 摘要。

macOS 第一次讀取其他 App 的選取文字時，請在「系統設定 → 隱私權與安全性 → 輔助使用」允許 Unus；沒有此權限時，快捷鍵仍會開啟手動輸入視窗。

模型檔案儲存於：

```text
%APPDATA%\Lexicon\models\gemma-4-E2B-it-UD-IQ2_M.gguf
```

macOS：

```text
~/Library/Application Support/Lexicon/models/gemma-4-E2B-it-UD-IQ2_M.gguf
```

## 開發環境

需要 Node.js 22.12+。

```bash
npm install
npm run dev
```

Windows 也可在 repo 根目錄執行 `./run.ps1`；舊 `investment/run.ps1` 會轉接相同入口。Unus 為 Django 和統一前端選擇可用本機埠，不再使用固定的 8000/5173 組合。

其他常用指令：

```bash
npm run typecheck
npm run build
npm run package
npm run package:mac
```

## 技術棧

| 元件 | 技術 |
|---|---|
| 桌面框架 | Electron |
| 語言 | TypeScript |
| Build | electron-vite |
| LLM 推理 | node-llama-cpp |
| 模型格式 | GGUF |
| 模型 | Gemma 4 E2B `UD-IQ2_M` |
| 打包 | electron-builder |

## YouTube 字幕整合

Unus 的 Chrome Extension 會把 YouTube 的英文字幕交給已啟動的 Unus，再由本機 Gemma 模型翻譯；翻譯內容不會送往雲端。

```text
YouTube 字幕
    ↓
Chrome Extension
    ↓
Native Messaging Host
    ↓
Unus 本機翻譯模型
    ├── YouTube 畫面：即時繁中字幕
    ├── Unus popup：目前句快速查看
    └── Unus 主視窗：完整逐字稿閱讀
```

使用方式：

- 影片播放時，在原始英文字幕下方顯示繁中即時翻譯。
- 點擊 Extension 圖示可在 Unus 主視窗閱讀該影片的完整逐字稿與逐段翻譯。
- 點擊字幕或使用目前設定的快捷鍵可在既有 popup 查看目前句。

第一次以開發版使用時：

1. Windows 執行 `npm run native-host:build`；macOS 執行 `npm run native-host:build:mac`，再啟動 Unus。
2. 在 `extensions/youtube/` 執行 `npm run dev`（或在專案根目錄執行 `npm run youtube:dev`）。
3. WXT 會自動開啟帶有 Extension 的 Chrome 開發視窗；不需要手動載入 `dist`。
4. Windows 以 PowerShell 註冊 native host：

   ```powershell
   .\tools\youtube\register-native-host.ps1 -NativeHostPath .\native-host\publish\win-x64\LexiconNativeHost.exe
   ```

   macOS 開發版啟動 Unus 時會自動註冊 Chrome native host。
5. 開啟有英文字幕的 YouTube 影片。即時翻譯顯示在原字幕下方；點 Extension 圖示可開啟完整逐字稿閱讀。

開發期間儲存 Vue、content script 或 background script 後，WXT 會更新開發版 Extension；不需要重新 deploy 或重新打包。若變更 `wxt.config.ts`，請重啟 `npm run dev`。

正式安裝版會由 NSIS installer 自動註冊 native host。整合的技術設計與 Chrome Web Store 發行規格見 [YouTube Extension 設計文件](docs/youtube-extension.md)。

## 目錄結構

```text
src/
├── main/
│   ├── index.ts                 # app lifecycle、tray、hotkey、IPC
│   ├── llm.ts                   # Gemma 4 translation engine
│   ├── model.ts                 # Hugging Face download + SHA256
│   └── selection.ts              # Windows selected-text capture
├── preload/
│   └── index.ts                 # contextBridge 安全橋接
└── renderer/
    ├── popup/                   # 翻譯 popup
    ├── setup/                   # 初次模型下載
    ├── settings/                # 設定頁骨架
    └── download-model/          # 模型下載頁骨架
```

## v1 範圍外

- 雲端同步
- 行動裝置版本
- 語音發音播放

## IELTS Speaking 工作區

Unus 內建 IELTS Speaking 題庫工作區，可瀏覽、篩選題目並記錄自己的練習方向。題庫更新工具與學習文件位於 [`tools/ielts/`](tools/ielts/) 與 [`docs/ielts/`](docs/ielts/)；以 `npm run ielts:materials` 重新產生題庫資料。
