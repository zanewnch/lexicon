# Phase 0 — App Bootstrap

應用程式啟動的核心初始化邏輯，全部位於 `main.js`。

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

## 系統匣右鍵選單

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

Renderer process 只能透過 `preload.js` 暴露的 `window.api` 與 main process 溝通，不能直接存取 Node.js 或 Electron API。
