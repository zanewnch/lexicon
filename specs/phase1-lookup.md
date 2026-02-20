# Phase 1 — 單字查詢面板

## LLM 引擎

`node-llama-cpp`，於 Electron main process 啟動時載入 GGUF 模型。

### 推薦模型

| 模型 | 大小 | 品質 | 適用情境 |
|---|---|---|---|
| `qwen2.5-3b-instruct.Q4_K_M.gguf` | ~2 GB | 良好 | 預設、低規格硬體 |
| `llama-3.2-3b-instruct.Q4_K_M.gguf` | ~2 GB | 良好 | 預設、備選 |
| `llama-3.1-8b-instruct.Q4_K_M.gguf` | ~5 GB | 更好 | 高規格硬體 |

### 預設參數

| 參數 | 預設值 | 說明 |
|---|---|---|
| `temperature` | 0.3 | 低溫確保輸出穩定、一致 |
| `max_tokens` | 300 | 足夠容納查詢格式 |
| `n_gpu_layers` | -1 | 有 GPU 時全部 layer 交給 GPU |
| `n_ctx` | 2048 | 上下文視窗大小 |

### API 介面

`src/main/llm.js` 對外提供兩個方法，透過 IPC 與 renderer process 溝通：

```js
async function* lookup(word)          // 查詢單字，async generator streaming tokens
async function* chat(message, history) // 追問聊天（Phase 3 使用），streaming tokens
```

`history` 格式遵循 OpenAI chat format：
```json
[
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
```

Renderer 透過 `preload.js` 暴露的 `window.api` 呼叫，tokens 以 IPC event 逐筆推送。

---

## 回應格式

LLM 的初始回應固定採用以下格式，不得有額外文字：

```
Word: <單字>
IPA: /<音標>/
Part of Speech: <名詞 / 動詞 / 形容詞 / ...>

Meaning:
<清楚的英文定義>

Example Sentences:
1. <例句>
2. <例句>
3. <例句>
```

### System Prompt

```
You are a concise English dictionary assistant.
When given a word, always respond in this exact format:

Word: <word>
IPA: /<ipa>/
Part of Speech: <part of speech>

Meaning:
<definition>

Example Sentences:
1. <sentence>
2. <sentence>
3. <sentence>

Do not add any extra commentary outside this format.
```

---

## UI 佈局

```
┌─────────────────────────────┐
│  Word: serendipity          │
│  IPA: /ˌsɛr.ənˈdɪp.ɪ.ti/   │
│  Part of Speech: noun       │
│                             │
│  Meaning:                   │
│  The occurrence of ...      │
│                             │
│  Example Sentences:         │
│  1. She found her dream ... │
│  2. ...                     │
│  3. ...                     │
│─────────────────────────────│
│  [Chatbot 區] → Phase 3     │
└─────────────────────────────┘
```

- 視窗無邊框（frameless），圓角設計
- 寬度固定：480px
- 高度自適應內容，最大高度 80vh，超過則捲動
- 點擊視窗外部關閉視窗

---

## Streaming 顯示

- LLM 回應以 streaming 方式逐字輸出至視窗
- 顯示順序：Word → IPA → Part of Speech → Meaning → Example Sentences
- 輸出過程中聊天輸入框禁用，輸出完成後啟用

---

## 錯誤狀態

| 情況 | 顯示文字 |
|---|---|
| LLM 尚未載入完成 | 「模型載入中，請稍候...」 |
| LLM 回應逾時（>30s） | 「查詢逾時，請再試一次」 |
| 回應格式不符預期 | 直接顯示原始回應文字 |
| Inference 過程中 crash | 見下方 LLM Crash Recovery |

---

## LLM Crash Recovery

`node-llama-cpp` 的 inference 拋出未預期錯誤時：

1. 捕捉例外，在彈出視窗顯示錯誤訊息：「推論失敗，嘗試重新載入模型…」
2. 自動嘗試重新載入模型一次（`llm.reload()`）
3. 重載成功 → 顯示「已恢復，請重新查詢」，視窗保持開啟
4. 重載失敗 → 顯示「模型載入失敗，請重啟應用程式」，並在系統匣顯示錯誤圖示

不自動重試 inference（避免重複錯誤循環）。
