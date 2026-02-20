# Phase 5 — Setup Wizard

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
│  ●  Download   │                                  │
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
│  ○  Download   │   We'll download the Qwen 2.5    │
│                │   3B language model to get you   │
│  ○  Done       │   started. (~2 GB, one-time)     │
│                │                                  │
│                │          [ Get Started ]         │
│                │                                  │
└────────────────┴──────────────────────────────────┘
```

- 點擊「Get Started」→ 進入 Step 2
- 視窗無法關閉（強制完成 Setup Wizard 才能使用 app）

---

## Step 2 — Download

```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Downloading model...           │
│                │                                  │
│  ●  Download   │   qwen2.5-3b-instruct.Q4_K_M     │
│                │                                  │
│  ○  Done       │   ████████████░░░░░░  62%        │
│                │   1.2 GB / 2.0 GB · 5.3 MB/s    │
│                │   ~2 min 30 sec remaining        │
│                │                                  │
│                │                      [ Cancel ]  │
└────────────────┴──────────────────────────────────┘
```

- 進度條即時更新
- 下載目標固定為 `qwen2.5-3b-instruct.Q4_K_M.gguf`
- 「Cancel」：中止下載，保留暫存檔，退回 Step 1（Welcome）
- 下載完成後自動觸發 SHA256 校驗，進入 Step 3

---

## Step 3 — Done

**成功：**
```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   You're all set!                │
│                │                                  │
│  ✓  Download   │   Copy a word, press             │
│                │   Ctrl+Shift+D, and Lexicon      │
│  ✓  Done       │   will look it up instantly.     │
│                │                                  │
│                │              [ Start Lexicon ]   │
└────────────────┴──────────────────────────────────┘
```

**失敗（SHA256 校驗失敗）：**
```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  ✓  Welcome    │   Download failed                │
│                │                                  │
│  ✕  Download   │   The file appears corrupted.    │
│                │   Please try again.              │
│  ○  Done       │                                  │
│                │                    [ Try Again ] │
└────────────────┴──────────────────────────────────┘
```

---

## 下載實作細節

### 下載來源

直接使用 Hugging Face Hub 官方 URL，格式為：

```
https://huggingface.co/<repo>/resolve/main/<filename>.gguf
```

HF Hub 支援 HTTP Range requests，不需要使用 mirror。

### 斷點續傳

下載至暫存路徑 `<filename>.gguf.tmp`，完成後再重新命名為 `<filename>.gguf`。

重試時檢查暫存檔大小，透過 `Range` header 從中斷點繼續：

```ts
const startByte = fs.existsSync(tmpPath) ? fs.statSync(tmpPath).size : 0
const headers = startByte > 0 ? { 'Range': `bytes=${startByte}-` } : {}
const response = await fetch(url, { headers })
const writer = fs.createWriteStream(tmpPath, { flags: startByte > 0 ? 'a' : 'w' })
```

「Cancel」中止下載時**保留暫存檔**，下次點擊 Get Started 可繼續（不刪除）。

### SHA256 校驗

**不 hardcode hash 值**，從 HF API 動態取得。

**重要：在下載開始前取得 SHA256**（不是下載完成後），原因是下載完成後可能網路已斷，導致驗證永遠失敗。

```ts
async function getRemoteSha256(repo: string, filename: string): Promise<string> {
  const res = await fetch(`https://huggingface.co/api/models/${repo}/tree/main`)
  const files = await res.json()
  const file = files.find((f: any) => f.path === filename)
  return file?.lfs?.sha256 ?? ''
}
```

流程：
1. 使用者點擊 Get Started → 先呼叫 HF API 取得 SHA256，存在記憶體
2. 開始下載
3. 下載完成 → 本地計算 SHA256（Node.js `crypto` 模組）與記憶體中的值比對
4. 不符則進入 Step 3 失敗狀態

---

## 錯誤處理

| 情況 | 行為 |
|---|---|
| 網路連線失敗 | Step 2 顯示錯誤訊息，提供 Retry 按鈕 |
| 磁碟空間不足 | 點擊 Get Started 前預先檢查，顯示「Not enough disk space (need ~2 GB)」 |
| 下載中途中斷 | 支援斷點續傳，保留暫存檔，Retry 從中斷點繼續 |
| SHA256 校驗失敗 | 進入 Step 3 失敗狀態，提供 Try Again |

---

## 模型儲存路徑

```
%APPDATA%\Lexicon\models\qwen2.5-3b-instruct.Q4_K_M.gguf
```

---

## 跳過 Setup Wizard（進階用途）

- 使用者可手動將 `.gguf` 檔案放置於模型目錄，Setup Wizard 不會出現
- 設定面板（Phase 6）可下載其他模型或切換已下載的模型
