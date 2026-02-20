# Phase 1 — App Bootstrap

應用程式啟動的核心初始化邏輯，全部位於 `main.ts`。

---

## 啟動順序

```
1. Single-instance 鎖定
   └─ 已有實例在執行 → 將焦點帶回既有實例，新進程退出

2. 讀取 config.json
   └─ 檔案不存在或解析失敗 → 使用預設值（不報錯，靜默覆寫）

3. 建立 system tray icon（electron.Tray）
   └─ 右鍵選單：Settings / ─── / Quit

4. 檢查模型目錄 %APPDATA%\Lexicon\models\
   ├─ 無 .gguf 檔案 → 開啟 Setup Wizard 視窗（強制完成才能繼續）
   └─ 有 .gguf 檔案 → 在背景開始載入設定中的模型

5. 註冊全域快捷鍵（electron.globalShortcut）
   └─ 衝突（register 回傳 false）→ 系統通知提示使用者至設定更換

6. 模型載入完成 → App 就緒，開始回應快捷鍵
```

---

## Single Instance

```js
// main.js
const lock = app.requestSingleInstanceLock()
if (!lock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 若彈出視窗已開啟，將其帶至前景
    if (popupWindow) popupWindow.focus()
  })
}
```

---

## 系統匣（System Tray）

系統匣是 Windows 工作列右下角的通知區域，顯示常駐於背景執行的應用程式圖示。Lexicon 常駐於系統匣，讓使用者在不佔用工作列的情況下隨時存取設定或退出應用程式。

### 右鍵選單

```
Settings
───────────
Quit
```

- 點擊「Settings」→ 開啟設定面板視窗（若已開啟則帶至前景）
- 點擊「Quit」→ 登出全域快捷鍵、結束進程

---

## Electron 安全設定

所有 `BrowserWindow` 建立時使用以下設定：

```js
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // renderer 與 Node.js 環境隔離
    nodeIntegration: false,   // renderer 不能直接呼叫 Node.js API
    sandbox: true,            // renderer 在沙箱中執行
    preload: path.join(__dirname, 'preload.js')  // 唯一 IPC 橋樑
  }
})
```

Renderer process 只能透過 `preload.ts` 暴露的 `window.api` 與 main process 溝通，不能直接存取 Node.js 或 Electron API。

---

## IPC 頻道一覽（`window.api`）

`preload.ts` 透過 `contextBridge.exposeInMainWorld('api', {...})` 暴露以下方法與事件：

| 方法 / 事件 | 方向 | 說明 |
|---|---|---|
| `lookup(word)` | renderer → main | 查詢單字，觸發 streaming |
| `chat(message, history)` | renderer → main | 送出追問，觸發 streaming |
| `stopStream()` | renderer → main | 中止目前 streaming |
| `onToken(cb)` | main → renderer | 收到 LLM token（streaming） |
| `onStreamEnd(cb)` | main → renderer | streaming 結束 |
| `downloadStart(url, filename)` | renderer → main | 開始下載 GGUF |
| `downloadCancel()` | renderer → main | 取消下載 |
| `onDownloadProgress(cb)` | main → renderer | 下載進度 `{bytes, total, speed, eta}` |
| `onDownloadDone(cb)` | main → renderer | 下載完成（含 SHA256 校驗結果） |
| `modelList()` | renderer → main | 取得已下載的 model 列表 |
| `modelSwitch(filename)` | renderer → main | 切換 model |
| `onModelReady(cb)` | main → renderer | model 載入完成 |
| `configGet()` | renderer → main | 讀取 config |
| `configSet(key, value)` | renderer → main | 寫入 config 單一欄位 |

### Streaming Listener 清理

`ipcRenderer.on()` 會累積 listener，必須在每次新 streaming 開始前移除舊的：

```ts
// preload.ts
onToken(cb: (token: string) => void) {
  ipcRenderer.removeAllListeners('llm:token')
  ipcRenderer.on('llm:token', (_e, token) => cb(token))
},
onStreamEnd(cb: () => void) {
  ipcRenderer.removeAllListeners('llm:end')
  ipcRenderer.once('llm:end', () => cb())
},
```

每次呼叫 `onToken` / `onStreamEnd` 前自動清除前一次的 listener，避免 memory leak。
