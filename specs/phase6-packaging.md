# Phase 6 — 打包與發布

## 工具

`electron-builder`

---

## 打包指令

```bash
npm run build
# 等同於：
electron-builder --win --x64
```

`package.json` 的 build 設定：

```json
{
  "build": {
    "appId": "com.lexicon.app",
    "productName": "Lexicon",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false
    }
  }
}
```

---

## 模型處理策略

模型檔案**不打包**進安裝檔：

- 打包進去會使安裝檔超過 2 GB，不切實際
- 首次執行時由 Phase 4 Setup Wizard 負責下載
- 使用者亦可手動放置 `.gguf` 至模型目錄

---

## 依賴注意事項

- `node-llama-cpp` 包含預編譯的 llama.cpp native binding，打包時需確認目標平台的 binding 正確包入
- `electron-builder` 會自動處理 native module rebuild（`electron-rebuild`）
- Windows 安裝檔使用 NSIS installer，使用者不需要手動解壓

---

## Code Signing

v1 **不簽章**。未簽章的 `.exe` 在 Windows 上會觸發 SmartScreen 警告：

```
Windows 已保護您的電腦
Microsoft Defender SmartScreen 已阻止未知的應用程式啟動。
```

使用者可透過「更多資訊 → 仍要執行」繞過。

發布說明需加入此說明，避免使用者誤以為是惡意程式。

---

## 開機自動啟動

由 Phase 5 設定面板控制，使用 `app.setLoginItemSettings()`。打包本身無需額外設定。

---

## 發布確認清單

- [ ] 安裝檔在 Windows 10 / 11 上不需任何預裝依賴即可執行
- [ ] Setup Wizard 能成功下載並通過 SHA256 校驗
- [ ] 快捷鍵在系統全域有效（不限於應用程式視窗在前景時）
- [ ] 關閉彈出視窗後應用程式繼續常駐於系統匣
- [ ] 設定變更後正確寫入 `config.json`
- [ ] 模型切換後能成功重新載入

---

## 輸出路徑

```
dist/
└── Lexicon Setup 1.0.0.exe
```
