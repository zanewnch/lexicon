# Phase 3 — Ctrl+1 全域翻譯

## 使用流程

1. 使用者在任意 Windows 視窗選取文字。
2. 按下全域快捷鍵 `Ctrl+1`。
3. Lexicon 暫存文字剪貼簿，使用 Windows `SendInput` 模擬 `Ctrl+C`。
4. 讀取選取內容後還原原本文字剪貼簿。
5. Popup 顯示在目前游標附近。
6. 有選取內容時立即翻譯；沒有選取內容時聚焦輸入框。

## 快捷鍵

固定為 `Ctrl+1`，第一版不提供快捷鍵設定 UI。

快捷鍵使用 Electron `globalShortcut.register()`，主要支援 Windows。

若快捷鍵已被其他程式佔用，Lexicon 顯示 Windows notification，並保留 system tray 與模型設定功能。

## 選取文字

- 只支援 Windows。
- 以隨機 sentinel 暫時取代文字剪貼簿，避免誤讀舊內容。
- 複製成功後讀取 `.trim()` 結果。
- 複製失敗、沒有選取內容或取得空字串時，回傳手動輸入模式。
- 使用 `finally` 還原原本文字剪貼簿。
- 第一版只保留文字內容，不處理圖片或其他非文字格式。

## Popup 位置與生命週期

- 使用 `screen.getCursorScreenPoint()` 取得游標位置。
- 預設位於游標右下方，靠近螢幕邊緣時自動翻到另一側並限制在 work area 內。
- Popup 寬度 420px、高度 360px、無 frame、不可調整大小。
- 點擊外部、按 `Esc` 或再次按 `Ctrl+1` 時隱藏 popup，不 destroy window。

## 翻譯模式

- 有選取文字：填入輸入框並自動執行翻譯。
- 無選取文字：清空輸入框並自動 focus。
- `Enter` 送出，`Shift+Enter` 換行。
- 翻譯失敗時顯示錯誤，保留輸入內容供重試。
