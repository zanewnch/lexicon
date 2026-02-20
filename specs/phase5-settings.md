# Phase 5 — 設定面板

## 開啟方式

- 右鍵點擊系統匣圖示 → 「設定」
- 設定面板以獨立視窗開啟（非彈出視窗）

---

## 設定項目

### 快捷鍵

- 顯示目前快捷鍵
- 點擊輸入框後進入「錄製模式」，使用者按下組合鍵即設定
- 禁止設定單一按鍵（需包含 Ctrl / Alt / Win 其中之一）
- 儲存時重新向 OS 註冊快捷鍵；若衝突則提示使用者

### 模型

- 下拉選單列出 `%APPDATA%\Lexicon\models\` 內的所有 `.gguf` 檔案
- 顯示各模型檔案大小
- 提供「下載更多模型」按鈕，開啟 Phase 4 Setup Wizard 的模型選擇步驟
- 切換模型需重新載入（顯示「重新載入中...」）

### LLM 參數

| 設定項 | 元件 | 範圍 | 預設值 |
|---|---|---|---|
| Temperature | slider + 數字輸入 | 0.0 – 1.0 | 0.3 |
| Max Tokens | 數字輸入 | 50 – 2048 | 300 |

`n_ctx`（上下文視窗大小）固定為 2048，不在 UI 中暴露——對非開發者來說過於技術性，且變動此值需重啟模型。

### 開機自動啟動

- 開關（預設：關閉）
- 實作：`app.setLoginItemSettings({ openAtLogin: true/false })`
- 啟用時，Windows 開機後 Lexicon 靜默常駐於系統匣（不彈出任何視窗）

### 介面語言

- 單選：English / 繁體中文
- 切換後立即套用（不需重啟）

---

## 設定儲存

- 所有設定存入 `%APPDATA%\Lexicon\config.json`
- 每次修改後立即寫入（不需手動按儲存）
- 格式範例：

```json
{
  "hotkey": "ctrl+shift+d",
  "model": "qwen2.5-3b-instruct.Q4_K_M.gguf",
  "temperature": 0.3,
  "max_tokens": 300,
  "language": "zh-TW",
  "launch_at_startup": false
}
```

### Config 損毀處理

`config.js` 讀取 `config.json` 時若發生 JSON parse 錯誤：

1. 記錄錯誤至 console（不顯示給使用者）
2. 以預設值繼續啟動
3. 以預設值覆寫 `config.json`（靜默修復，不提示）

---

## 重置設定

- 設定面板底部提供「恢復預設值」按鈕
- 點擊後顯示確認對話框，確認後覆寫 `config.json`
