# Investment

> 投資系統已合併至 **Unus**。英文與投資共用主介面、設定和啟動流程，啟動與資料路徑以 repo 根目錄 README 為準。

這個專案的目標不是造輪子，而是針對自己的交易需求做客製化。現在 vibe coding 的效果很好，搭配 AI 輔助開發，可以快速把想法變成可用的工具，才有了這個專案。

台股投資分析與交易系統，使用 Vue 3 + Django + Shioaji API 開發。

## 技術架構

- **前端**：Vue 3
- **後端**：Django (Python)
- **股市資料來源**：永豐金證券 Shioaji API

vite-plugin-vue-devtools

## 啟動專案

從 Unus repo 根目錄執行 `npm run dev` 或 `./run.ps1`，由桌面管理統一前端、Django 和英文本機服務。此目錄的 `run.ps1` 會轉接根目錄入口。

首次安裝 Python 相依套件：`pip install -r investment/backend/requirements.txt`；前端從此目錄的 `frontend/` 執行 `npm ci`。統一 Vite 使用隨機可用本機埠並代理 Django，網址由當次 Unus 啟動決定。

## 資料與筆記

投資資料使用 `%APPDATA%/lexicon/investment/investment.sqlite3`，英文資料使用同一使用者資料目錄的 `lexicon.sqlite`。兩者都不在 Git 或安裝包內。

筆記仍透過 Django `notes_cli` 讀寫。執行前設定 `LEXICON_INVESTMENT_DATA_DIR` 指向既有使用者資料目錄的 `investment/`，先確認 `investment.sqlite3` 存在，再從此目錄執行 `python backend/manage.py notes_cli ...`。Windows 同時設定 `PYTHONIOENCODING=utf-8`，篩選與寫入使用 UTF-8 JSON 暫存檔；資料庫不存在時停止，避免建立空白資料庫。

## Shioaji API 相關文件

| 說明 | 連結 |
|------|------|
| Python API 教學 | https://ai.sinotrade.com.tw/python/Main/index.aspx#pag4-2 |
| 快速入門 | https://sinotrade.github.io/zh/quickstart/#_1 |
| 官方文件 (繁中) | https://sinotrade.github.io/zh_TW/ |
| API Key 申請 | https://www.sinotrade.com.tw/newweb/PythonAPIKey/ |

環境權限、CA 憑證及正式交易前置條件整理：[Shioaji 模擬與正式環境設計](docs/shioaji-environments.md)。

## FinMind api key
https://finmindtrade.com/analysis/#/account/user
