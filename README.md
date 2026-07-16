# Lexicon

Lexicon 是一個常駐 Windows 桌面的本地 LLM 翻譯工具。選取任何文字後按下 `Ctrl+1`，它會在游標附近開啟小視窗並自動進行中翻英；沒有選取文字時，視窗會直接提供輸入框。

## 目前功能

- `Ctrl+1` 全域快捷鍵
- Windows 自動取得選取文字，並還原原本的文字剪貼簿
- 游標附近 popup，點擊外部或按 `Esc` 關閉
- 沒有選取文字時直接輸入繁體中文
- 本地 Gemma 4 E2B GGUF 翻譯，不需要 API key
- 推理 backend 依序嘗試 CUDA（NVIDIA）→ Vulkan（Intel/AMD 等相容 GPU）→ CPU
- 目前 `node-llama-cpp` GGUF runtime 沒有 NPU backend，因此 NPU 不會被誤報為已使用
- Setup Wizard 從 Hugging Face 下載模型並驗證 SHA256
- Windows NSIS installer 打包

## 使用方式

1. 啟動 Lexicon。
2. 第一次啟動時，在 Setup Wizard 下載 Gemma 4 E2B 模型（約 2.29 GB）。
3. 在任何 Windows 程式選取中文，按 `Ctrl+1`。
4. 沒有選取文字時，按 `Ctrl+1` 後直接在 popup 輸入中文。

模型檔案儲存於：

```text
%APPDATA%\Lexicon\models\gemma-4-E2B-it-UD-IQ2_M.gguf
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
- 非 Windows 平台的全域選取文字支援
