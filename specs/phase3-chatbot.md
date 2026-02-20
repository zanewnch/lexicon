# Phase 3 — Chatbot 介面

## 概述

查詢結果顯示完成後，使用者可在同一視窗內繼續追問，深入了解單字，不需切換視窗。

---

## System Prompt

每次查詢新單字時，以下 system prompt 注入至對話 session（`{word}` 替換為實際單字）：

```
You are a helpful English vocabulary assistant. The user has just looked up the word "{word}".

Answer follow-up questions about this word: its usage, nuances, collocations, related words, etymology, or anything else the user wants to know.

Keep answers concise and practical. Use examples when helpful. If the user asks something unrelated to English vocabulary or language, politely redirect them.
```

此 system prompt 作為對話記錄的第一筆，role 為 `system`。查詢新單字時完整重置。

---

## 整體佈局

```
┌──────────────────────────────────────┐  ← 視窗（480px 寬）
│                                      │
│  [查詢結果區 Phase 1]                 │
│                                      │
│──────────────────────────────────────│  ← 分隔線
│                                      │
│  ╭──────────────────────────────╮    │
│  │ 這個字在商業場合常見嗎？      │    │  ← 使用者訊息（靠右）
│  ╰──────────────────────────────╯    │
│                                      │
│  ╭──────────────────────────────╮    │
│  │ Yes, it's commonly used in   │    │  ← assistant 訊息（靠左）
│  │ formal business writing...   │    │
│  ╰──────────────────────────────╯    │
│                                      │
│──────────────────────────────────────│
│  ┌──────────────────────┐  ┌──────┐  │
│  │ Ask a follow-up...   │  │ Send │  │  ← 輸入區
│  └──────────────────────┘  └──────┘  │
└──────────────────────────────────────┘
```

---

## 訊息氣泡

### 使用者訊息

- 靠右對齊，左側留空
- 背景色：主色（藍）
- 文字色：白
- 圓角：12px，右下角為 4px（表示「說話方向」）
- 最大寬度：視窗的 75%

### Assistant 訊息

- 靠左對齊，右側留空
- 背景色：淺灰
- 文字色：深灰（正文）
- 圓角：12px，左下角為 4px
- 最大寬度：視窗的 85%（assistant 回應通常較長）

### 間距

- 訊息與訊息之間：12px
- 同一角色連續訊息之間：4px（不重複顯示角色 label）
- 聊天區域 padding：12px（左右）

---

## 訊息狀態

### 1. Streaming（LLM 輸出中）

```
╭────────────────────────────╮
│ Yes, it's commonly used▌   │   ← 游標閃爍
╰────────────────────────────╯
```

- 逐字 append 至氣泡內
- 氣泡高度隨內容自動展開
- 游標（`▌`）在最後一個字元後閃爍，輸出完成後消失

### 2. 完成

- 游標消失
- 輸入框從禁用變回可用，自動 focus

### 3. 錯誤

```
╭────────────────────────────╮
│ ⚠ 回應失敗，請再試一次      │   ← 錯誤訊息（紅色背景）
╰────────────────────────────╯
```

- 顯示錯誤氣泡（紅色背景、白字）
- 輸入框重新啟用，使用者可重送

---

## 輸入區

### 輸入框

- `<textarea>` 元件，placeholder：`Ask a follow-up...`
- 預設高度：1 行；最多自動展高至 4 行，超過則捲動
- 字型大小：14px，行高 1.5

### 鍵盤行為

| 按鍵 | 動作 |
|---|---|
| `Enter` | 送出訊息 |
| `Shift+Enter` | 在輸入框內換行 |
| `Escape` | 清空輸入框（若有內容）；若已空則關閉視窗 |

### Send 按鈕

| 狀態 | 外觀 |
|---|---|
| 輸入框有內容 | 主色，可點擊 |
| 輸入框為空 | 灰色，disabled |
| LLM 輸出中 | 顯示停止圖示（⬛），點擊可中止輸出 |

### 中止輸出

- LLM streaming 過程中，Send 按鈕變為「停止」按鈕
- 點擊後立即停止 streaming
- 已輸出的部分保留在氣泡中，末尾加上 `[已停止]` 標示
- 輸入框立即恢復可用

---

## 捲動行為

- 聊天區域有固定最大高度：`calc(80vh - Phase 1高度 - 輸入區高度)`
- 超過後捲動，最新訊息永遠可見
- 新訊息出現時自動捲至底部（smooth scroll）
- 例外：若使用者手動向上捲動（表示在看舊訊息），新訊息出現時**不**自動捲動，改在底部顯示「↓ 新訊息」按鈕

---

## 空狀態（尚未追問）

- 查詢結果顯示完成後，聊天區域顯示提示文字：
  ```
  有任何問題嗎？在下方輸入追問。
  ```
- 提示文字灰色、居中、字型稍小
- 使用者送出第一則訊息後，提示文字消失

---

## 對話記錄管理

- 每次查詢建立一個獨立的對話 session
- 對話記錄包含：
  1. system prompt（含當前單字）
  2. 初始查詢回應（作為 assistant 第一則訊息，但不顯示在聊天區——已顯示於 Phase 1）
  3. 後續使用者與 assistant 的來回
- 查詢新單字時，UI 清空、對話記錄完整重置

### Token 截斷策略

- 送出前計算整個 history 的 token 數
- 若超過 `n_ctx - max_tokens`（預留給回應的空間）：
  - 從最早的「使用者 + assistant」輪次開始丟棄
  - 永遠保留：system prompt + 初始查詢回應（第一輪）
