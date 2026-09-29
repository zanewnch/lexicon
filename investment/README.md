# Investment

> 這份文件保留原投資系統的開發說明。整合後的啟動、資料路徑與打包流程請以 Lexicon 專案根目錄的 README 為準；此處的 `run.ps1` 僅供單獨開發投資程式。

這個專案的目標不是造輪子，而是針對自己的交易需求做客製化。現在 vibe coding 的效果很好，搭配 AI 輔助開發，可以快速把想法變成可用的工具，才有了這個專案。

台股投資分析與交易系統，使用 Vue 3 + Django + Shioaji API 開發。

## 技術架構

- **前端**：Vue 3
- **後端**：Django (Python)
- **股市資料來源**：永豐金證券 Shioaji API

vite-plugin-vue-devtools

## 啟動專案

首次使用先安裝後端與前端套件，並在 `backend` 執行 `python manage.py migrate`。之後在專案根目錄用 PowerShell 執行：

```powershell
.\run.ps1
```

它會先檢查 Django 與資料庫 migration，再同時啟動前端（http://127.0.0.1:5173）與後端（http://127.0.0.1:8000）；按 Ctrl+C 停止兩者。若預設埠已被占用或 migration 尚未套用，腳本會提示並停止。`activate_backend.ps1` 仍可單獨啟動後端。

### 後端 (Django)

```bash
cd backend
pip install -r requirements.txt      # 首次安裝套件
python manage.py migrate              # 首次或 model 變更時執行
python manage.py runserver            # 啟動 dev server (http://127.0.0.1:8000)
```

> Django `runserver` 內建 hot reload，修改 `.py` 檔案後 server 會自動重啟。

### 筆記資料

筆記儲存在本機 `backend/db.sqlite3`，此檔案不再由 Git 追蹤。首次執行 `python manage.py migrate` 時，`notes` migration 會把 `frontend/src/data/seedNotes.json` 的舊筆記匯入資料庫並保留原 ID 與時間；該 JSON 往後僅作為遷移快照。請定期備份本機資料庫，換電腦時也要搬移此檔案或從備份還原。

AI 與本機工作流程可直接使用 Django Notes CLI，不必啟動 HTTP backend。CLI 使用 Django 設定中的同一個資料庫；執行前仍須安裝後端相依套件並完成 migration。從專案根目錄執行：

```powershell
python backend/manage.py notes_cli list --filter-file C:\tmp\note-filter.json
python backend/manage.py notes_cli get note-5f1d8435
python backend/manage.py notes_cli create --input-file C:\tmp\note.json
python backend/manage.py notes_cli update note-5f1d8435 --input-file C:\tmp\note-update.json
python backend/manage.py notes_cli append note-5f1d8435 --input-file C:\tmp\note-append.json
python backend/manage.py notes_cli delete note-5f1d8435 --confirm
```

篩選與寫入內容使用 UTF-8 JSON 檔案，避免把中文 JSON 直接嵌入 shell 命令。`list` 支援 `title`（完全相同）、`tags`（需全部符合）、`category`、`pinned`、`q`（搜尋標題及內容）篩選，並以 JSON 輸出；`append` 只接受 `{"content":"..."}` 並附加 Markdown，不覆蓋原內容；刪除需明確加上 `--confirm`。

### 前端 (Vue 3 + Vite)

```bash
cd frontend
npm install       # 首次安裝套件
npm run dev       # 啟動 dev server (Vite，內建 HMR)
```

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
