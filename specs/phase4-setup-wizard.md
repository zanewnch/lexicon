# Phase 4 — Setup Wizard

## 觸發條件

- 應用程式啟動時，若 `%APPDATA%\Lexicon\models\` 目錄下不存在任何 `.gguf` 檔案
- 顯示為獨立視窗（640 × 420px），置中於螢幕，無邊框

---

## 整體佈局

左側固定步驟列，右側為內容區，步驟狀態即時更新。

```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │                                  │
│                │   [右側內容區，隨步驟切換]        │
│  ●  Model      │                                  │
│                │                                  │
│  ○  Download   │                                  │
│                │                                  │
│  ○  Done       │                                  │
│                │                                  │
└────────────────┴──────────────────────────────────┘
```

步驟狀態圖示：
- `○` 尚未到達
- `●` 目前步驟（藍色，active）
- `✓` 已完成（綠色）
- `✕` 失敗（紅色）

---

## Step 1 — Welcome

```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Welcome to Lexicon             │
│                │                                  │
│  ○  Model      │   We'll download a language      │
│                │   model to get you started.      │
│  ○  Download   │   (~2 GB, one-time)              │
│                │                                  │
│  ○  Done       │                                  │
│                │          [ Get Started ]         │
│                │                                  │
└────────────────┴──────────────────────────────────┘
```

- 點擊「Get Started」→ 進入 Step 2
- 視窗無法關閉（強制完成 Setup Wizard 才能使用 app）

---

## Step 2 — Model

```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Choose a model                 │
│                │                                  │
│  ●  Model      │   ● qwen2.5-3b  Q4_K_M  ~2 GB   │
│                │     Recommended · Fast           │
│  ○  Download   │                                  │
│                │   ○ llama-3.2-3b Q4_K_M  ~2 GB  │
│  ○  Done       │     Alternative                  │
│                │                                  │
│                │   ○ llama-3.1-8b Q4_K_M  ~5 GB  │
│                │     Better quality · Needs 8GB+  │
│                │                                  │
│                │                    [ Download ]  │
└────────────────┴──────────────────────────────────┘
```

- 預設選取第一項（qwen2.5-3b）
- 點擊「Download」→ 進入 Step 3

---

## Step 3 — Download

```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Downloading model...           │
│                │                                  │
│  ✓  Model      │   qwen2.5-3b-instruct.Q4_K_M     │
│                │                                  │
│  ●  Download   │   ████████████░░░░░░  62%        │
│                │   1.2 GB / 2.0 GB · 5.3 MB/s    │
│  ○  Done       │   ~2 min 30 sec remaining        │
│                │                                  │
│                │                      [ Cancel ]  │
└────────────────┴──────────────────────────────────┘
```

- 進度條即時更新
- 「Cancel」：中止下載，刪除暫存檔，退回 Step 2
- 下載完成後自動觸發 SHA256 校驗，進入 Step 4

---

## Step 4 — Done

**成功：**
```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   You're all set!                │
│                │                                  │
│  ✓  Model      │   Copy a word, press             │
│                │   Ctrl+Shift+D, and Lexicon      │
│  ✓  Download   │   will look it up instantly.     │
│                │                                  │
│  ✓  Done       │                                  │
│                │              [ Start Lexicon ]   │
└────────────────┴──────────────────────────────────┘
```

**失敗（SHA256 校驗失敗）：**
```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Download failed                │
│                │                                  │
│  ✓  Model      │   The file appears corrupted.    │
│                │   Please try again.              │
│  ✕  Download   │                                  │
│                │                                  │
│  ○  Done       │                    [ Try Again ] │
└────────────────┴──────────────────────────────────┘
```

---

## 錯誤處理

| 情況 | 行為 |
|---|---|
| 網路連線失敗 | Step 3 顯示錯誤訊息，提供 Retry 按鈕 |
| 磁碟空間不足 | 點擊 Download 前預先檢查，顯示「Not enough disk space (need X GB)」 |
| 下載中途中斷 | 支援斷點續傳（HTTP Range requests），重試時從中斷點繼續 |
| SHA256 校驗失敗 | 進入 Step 4 失敗狀態，提供 Try Again |

---

## 模型儲存路徑

```
%APPDATA%\Lexicon\models\<filename>.gguf
```

---

## 跳過 Setup Wizard（進階用途）

- 使用者可手動將 `.gguf` 檔案放置於模型目錄，Setup Wizard 不會出現
- 設定面板（Phase 5）可手動指定模型路徑
