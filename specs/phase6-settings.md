# Phase 6 — 設定面板

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

模型區塊分兩部分：

**Part 1 — 切換已下載的 model**

- 下拉選單列出 `%APPDATA%\Lexicon\models\` 內的所有 `.gguf` 檔案
- 顯示各模型檔案名稱 + 大小
- 切換後自動重新載入，期間顯示「重新載入中...」

**Part 2 — 下載新 model**

- 「Download a model」按鈕，點擊後彈出獨立的 Download Model 視窗

#### Download Model 視窗

```
┌──────────────────────────────────────┐
│  Download a Model                    │
│                                      │
│  ● qwen2.5-3b  Q4_K_M  ~2 GB        │
│    Recommended · Fast                │
│                                      │
│  ○ llama-3.2-3b Q4_K_M  ~2 GB       │
│    Alternative                       │
│                                      │
│  ○ llama-3.1-8b Q4_K_M  ~5 GB       │
│    Better quality · Needs 8GB+       │
│                                      │
│  ── 或輸入自訂 HF URL ──              │
│  ┌────────────────────────────────┐  │
│  │ https://huggingface.co/...     │  │
│  └────────────────────────────────┘  │
│  貼上 HF 上任意 .gguf 檔案的直連 URL  │
│                                      │
│              [ Cancel ] [ Download ] │
└──────────────────────────────────────┘
```

- 選 curated list 或輸入自訂 URL，二擇一（互斥）
- 自訂 URL 需為 `.gguf` 結尾，Download 按鈕點擊前驗證格式
- 點 Download 後，視窗內容切換為進度條，邏輯同 Setup Wizard 下載步驟（斷點續傳）
- 下載完成後視窗自動關閉，下拉選單自動更新並切換到新 model

#### SHA256 校驗範圍

| 來源 | SHA256 校驗 |
|---|---|
| Curated list（3 個） | 是，從 HF API 動態取得 |
| 自訂 URL | 否，user 自行負責 |

#### 維護說明

Curated list 目前 hardcode 以下 3 個 model，之後有需要再擴充，不需要動態機制：

| Model | 檔案 | 大小 |
|---|---|---|
| qwen2.5-3b-instruct | Q4_K_M.gguf | ~2 GB |
| llama-3.2-3b-instruct | Q4_K_M.gguf | ~2 GB |
| llama-3.1-8b-instruct | Q4_K_M.gguf | ~5 GB |

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
