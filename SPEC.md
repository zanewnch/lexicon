# Lexicon — 主規格

## 概述

一個輕量的 Windows 桌面應用程式，讓使用者透過全域快捷鍵即時查詢英文單字。應用程式會顯示單字的意思、IPA 發音以及例句，並由本地 LLM 驅動。查詢視窗內附追問聊天功能，讓使用者可以深入了解單字而不需切換視窗。

目標使用者：非開發者。應用程式以單一 `.exe` 發布，不需要安裝任何外部依賴。

---

## 核心功能

| 功能 | 說明 | 詳細規格 |
|---|---|---|
| Phase 0 — App Bootstrap | 啟動順序、single instance、tray、安全設定 | [specs/phase0-bootstrap.md](specs/phase0-bootstrap.md) |
| Phase 1 — 單字查詢面板 | 顯示意思、IPA、詞性、例句 | [specs/phase1-lookup.md](specs/phase1-lookup.md) |
| Phase 2 — 全域快捷鍵觸發 | 複製單字後按快捷鍵彈出查詢視窗 | [specs/phase2-hotkey.md](specs/phase2-hotkey.md) |
| Phase 3 — Chatbot | 查詢結果下方的對話介面 | [specs/phase3-chatbot.md](specs/phase3-chatbot.md) |
| Phase 4 — Setup Wizard | 引導使用者下載 GGUF 模型 | [specs/phase4-setup-wizard.md](specs/phase4-setup-wizard.md) |
| Phase 5 — 設定面板 | 快捷鍵、模型、LLM 參數、語言 | [specs/phase5-settings.md](specs/phase5-settings.md) |
| Phase 6 — 打包與發布 | electron-builder 打包、發布確認清單 | [specs/phase6-packaging.md](specs/phase6-packaging.md) |

---

## 架構

```
┌─────────────────────────────────────┐
│         全域快捷鍵監聽器             │
│  electron.globalShortcut            │
└────────────────┬────────────────────┘
                 │ 觸發
                 ▼
┌─────────────────────────────────────┐
│         剪貼簿讀取器                 │
│         electron.clipboard          │
└────────────────┬────────────────────┘
                 │ 單字字串
                 ▼
┌─────────────────────────────────────┐
│         LLM 引擎（Main Process）     │
│         (node-llama-cpp)            │
│                                     │
│  - 啟動時載入 GGUF 模型             │
│  - 維護對話記錄                     │
│  - 提供：lookup(word)               │
│           chat(message, history)    │
└────────────────┬────────────────────┘
                 │ IPC streaming tokens
                 ▼
┌─────────────────────────────────────┐
│         UI 層（Renderer Process）    │
│         (Electron BrowserWindow)    │
│                                     │
│  - 彈出視窗（無邊框）               │
│  - 查詢結果顯示                     │
│  - 聊天輸入框 + 對話記錄            │
│  - 設定面板                         │
│  - Setup Wizard                     │
│  - 系統匣（electron.Tray）          │
└─────────────────────────────────────┘
```

---

## 初始化

```bash
npm create @quick-start/electron@latest lexicon -- --template=vanilla-ts
```

使用 **electron-vite** + TypeScript。實際目錄結構以 CLI 產生結果為準，以下為預計加入的業務模組：

```
src/main/
├── llm.ts        # node-llama-cpp 封裝、對話記錄管理
├── prompts.ts    # System prompt 常數
├── hotkey.ts     # globalShortcut 註冊
├── tray.ts       # electron.Tray 系統匣
└── config.ts     # 設定讀寫（JSON）

src/renderer/     # 各視窗的 HTML + TypeScript
                  # 多頁面結構（popup / settings / setup）
```

---

## 資料儲存

所有使用者資料儲存於 `%APPDATA%\Lexicon\`：

```
%APPDATA%\Lexicon\
├── models\          # 下載的 GGUF 模型檔案
├── config.json      # 使用者設定
└── history.json     # （選用）單字查詢記錄
```

---

## v1 範圍外

- 非英文單字查詢
- 單字卡 / 間隔重複系統
- 雲端同步
- 行動裝置版本
- 語音發音播放
