# Phase 7 — 打包與發布

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
- 首次執行時由 Phase 5 Setup Wizard 負責下載
- 使用者亦可手動放置 `.gguf` 至模型目錄

---

## node-llama-cpp Native Binding 打包

`node-llama-cpp` 是 native addon，包含 `.node` binary，**不能被 asar 壓縮**，否則執行時會 crash。

### 解法：`asarUnpack`

在 `package.json` 的 build 設定加入：

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "node_modules/node-llama-cpp/**"
    ]
  }
}
```

`electron-builder` 會將 `node-llama-cpp` 解壓至 `resources/app.asar.unpacked/`，執行時能正常載入。`node-llama-cpp` v3+ 內部會自動定位正確 binding，不需要手動指定路徑。

### 驗證步驟（Phase 7 前必做）

```
npm run build → 解壓安裝 → 實際執行 → 確認 LLM 可 inference
```

不要等到所有功能完成才測試打包，應在 Phase 1 完成後立即做一次打包驗證。

---

## 依賴注意事項

- `node-llama-cpp` native binding 透過 `asarUnpack` 處理（見上方章節）
- `electron-builder` 會自動處理 native module rebuild（`electron-rebuild`）
- Windows 安裝檔使用 NSIS installer，使用者不需要手動解壓

---

## Code Signing 與 SmartScreen

v1 **不簽章**。未簽章的 `.exe` 在 Windows 上會觸發 SmartScreen 警告：

```
Windows 已保護您的電腦
Microsoft Defender SmartScreen 已阻止未知的應用程式啟動。
```

使用者可透過「更多資訊 → 仍要執行」繞過。

**發布說明必須包含以下內容**（截圖 + 文字說明）：

```
安裝時若出現 SmartScreen 警告，請：
1. 點擊「更多資訊」
2. 點擊「仍要執行」
這是因為 Lexicon 尚未取得程式碼簽章憑證，並非惡意程式。
```

長期方案：取得 EV Code Signing 憑證（約 $300–500 USD/年），可消除 SmartScreen 警告。v1 不實作。

---

## 開機自動啟動

由 Phase 6 設定面板控制，使用 `app.setLoginItemSettings()`。打包本身無需額外設定。

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

---

## GitHub Actions 自動打包與發布

### 觸發條件

推送 `v*` tag（例如 `v1.0.0`）時自動觸發打包並建立 GitHub Release。

### Workflow 設定

建立 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload release asset
        uses: softprops/action-gh-release@v2
        with:
          files: dist/*.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 發布流程

```bash
# 在本地打 tag 並推送
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 會自動：
1. 在 `windows-latest` 上執行 `npm ci` + `npm run build`
2. 建立 GitHub Release（以 tag 名稱命名）
3. 將 `dist/*.exe` 上傳為 Release Asset

使用者可直接從 GitHub Releases 頁面下載 `.exe` 安裝檔。

### 注意事項

- `runs-on: windows-latest` 是必要的，`node-llama-cpp` native binding 必須在 Windows 上編譯
- `GH_TOKEN` / `GITHUB_TOKEN` 為 GitHub Actions 內建的 secret，不需要手動設定
- `npm ci` 比 `npm install` 更適合 CI 環境（嚴格依照 `package-lock.json`，不更新依賴）
