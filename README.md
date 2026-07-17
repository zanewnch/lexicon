# Lexicon

Lexicon 是常駐桌面的本地 LLM 翻譯工具。Windows 選取文字後按下 `Ctrl+Shift+Q`，或 macOS 按下 `⌘⇧L`，會在游標附近開啟小視窗並自動翻譯；沒有選取文字時，視窗會直接提供輸入框。

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

1. 啟動 Lexicon。
2. 第一次啟動時，在 Setup Wizard 下載 Gemma 4 E2B 模型（約 2.29 GB）。
3. 在任何程式選取文字，Windows 按 `Ctrl+Shift+Q`；macOS 按 `⌘⇧L`。
4. 沒有選取文字時，按快捷鍵後直接在 popup 輸入內容。
5. 在主視窗選擇「新聞」，可輸入關鍵字搜尋即時新聞；選擇一則報導後可閱讀原文或產生本機 AI 摘要。

macOS 第一次讀取其他 App 的選取文字時，請在「系統設定 → 隱私權與安全性 → 輔助使用」允許 Lexicon；沒有此權限時，快捷鍵仍會開啟手動輸入視窗。

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

Lexicon 的 Chrome Extension 會把 YouTube 的英文字幕交給已啟動的 Lexicon，再由本機 Gemma 模型翻譯；翻譯內容不會送往雲端。

```text
YouTube 字幕
    ↓
Chrome Extension
    ↓
Native Messaging Host
    ↓
Lexicon 本機翻譯模型
    ├── YouTube 畫面：即時繁中字幕
    ├── Lexicon popup：目前句快速查看
    └── Lexicon 主視窗：完整逐字稿閱讀
```

使用方式：

- 影片播放時，在原始英文字幕下方顯示繁中即時翻譯。
- 點擊 Extension 圖示可在 Lexicon 主視窗閱讀該影片的完整逐字稿與逐段翻譯。
- 點擊字幕或使用目前設定的快捷鍵可在既有 popup 查看目前句。

第一次以開發版使用時：

1. Windows 執行 `npm run native-host:build`；macOS 執行 `npm run native-host:build:mac`，再啟動 Lexicon。
2. 在 `extensions/youtube/` 執行 `npm run dev`（或在專案根目錄執行 `npm run youtube:dev`）。
3. WXT 會自動開啟帶有 Extension 的 Chrome 開發視窗；不需要手動載入 `dist`。
4. Windows 以 PowerShell 註冊 native host：

   ```powershell
   .\tools\youtube\register-native-host.ps1 -NativeHostPath .\native-host\publish\win-x64\LexiconNativeHost.exe
   ```

   macOS 開發版啟動 Lexicon 時會自動註冊 Chrome native host。
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

Lexicon 內建 IELTS Speaking 題庫工作區，可瀏覽、篩選題目並記錄自己的練習方向。題庫更新工具與學習文件位於 [`tools/ielts/`](tools/ielts/) 與 [`docs/ielts/`](docs/ielts/)；以 `npm run ielts:materials` 重新產生題庫資料。
