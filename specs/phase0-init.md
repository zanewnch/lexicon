# Phase 0 — 專案初始化

## 建立專案

```bash
npm create @quick-start/electron@latest lexicon -- --template=vanilla-ts
```

使用 **electron-vite** + TypeScript。實際目錄結構以 CLI 產生結果為準。

---

## 業務模組目錄結構

以下為專案中需要手動新增的業務模組：

```
src/main/
├── llm.ts        # node-llama-cpp 封裝、對話記錄管理
├── prompts.ts    # System prompt 常數
├── hotkey.ts     # globalShortcut 註冊
├── tray.ts       # electron.Tray 系統匣
├── config.ts     # 設定讀寫（JSON）
└── download.ts   # GGUF 模型下載邏輯（Setup Wizard + Download Model 視窗共用）
                  # 含：斷點續傳、進度回報（IPC）、SHA256 校驗

src/renderer/     # 各視窗的 HTML + TypeScript
                  # 多頁面結構：
                  #   popup         — 單字查詢彈出視窗
                  #   settings      — 設定面板
                  #   setup         — Setup Wizard
                  #   download-model — Phase 6 的 Download Model 獨立視窗
```

---

## 資料目錄

所有使用者資料儲存於 `%APPDATA%\Lexicon\`：

```
%APPDATA%\Lexicon\
├── models\      # 下載的 GGUF 模型檔案
└── config.json  # 使用者設定
```

---

## electron-vite 多頁面設定

`npm create @quick-start/electron` 預設產生單頁結構，需手動修改 `electron.vite.config.ts` 啟用多頁面：

```ts
// electron.vite.config.ts
import { defineConfig } from 'electron-vite'

export default defineConfig({
  renderer: {
    build: {
      rollupOptions: {
        input: {
          popup:          'src/renderer/popup/index.html',
          settings:       'src/renderer/settings/index.html',
          setup:          'src/renderer/setup/index.html',
          'download-model': 'src/renderer/download-model/index.html',
        }
      }
    }
  }
})
```

每個頁面對應自己的 `index.html`，各自獨立的 TypeScript entry point。

---

## 完成標準

- [ ] `npm run dev` 可正常啟動 Electron 視窗
- [ ] TypeScript 編譯無錯誤
- [ ] 確認 electron-vite 多頁面結構（popup / settings / setup / download-model）可運作，各頁面可獨立載入
