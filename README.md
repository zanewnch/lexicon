# Lexicon

一個輕量的 Windows 桌面字典應用程式，由本地 LLM 驅動。複製單字後按快捷鍵，立即獲得意思、IPA 發音與例句，所有查詢都在本機處理，不傳送任何資料到網路。

---

## 功能

- **全域快捷鍵** — 複製單字，按 `Ctrl+Shift+D`，立即顯示結果
- **結構化查詢** — 每次都提供意思、IPA、詞性與三個例句
- **追問聊天** — 在同一視窗繼續追問單字相關問題
- **完全離線** — 使用本地 LLM，不需要 API 金鑰，設定完成後不需要網路
- **非開發者友善** — 單一 `.exe`，Setup Wizard 自動處理所有設定

---

## 系統需求

- Windows 10 / 11、macOS 12+、或 Linux
- 約 3 GB 可用磁碟空間（用於預設模型）
- 最低 8 GB RAM（建議 16 GB）
- GPU 非必要，但有 GPU 回應速度更快

---

## 安裝方式

1. 從 [Releases](#) 頁面下載 `Lexicon.exe`
2. 直接執行 `.exe`
3. 首次啟動時，Setup Wizard 會自動下載 LLM 模型（約 2 GB）
4. 下載完成後，應用程式常駐於系統匣，隨時可用

---

## 使用方式

1. 選取並複製任意英文單字（`Ctrl+C`）
2. 按下 `Ctrl+Shift+D`
3. 彈出視窗顯示單字的意思、IPA 與例句
4. 有疑問時在下方聊天框追問
5. 按 `Esc` 或關閉視窗即可收起

---

## 開發環境設定

**前置需求：** Python 3.11+、C++ 編譯器（llama-cpp-python 需要）

```bash
git clone https://github.com/yourname/pocket-dictionary
cd pocket-dictionary
pip install -r requirements.txt
python main.py
```

**打包成執行檔：**

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --icon=assets/icon.ico main.py
```

---

## 技術棧

| 元件 | 函式庫 |
|---|---|
| LLM 推理 | `llama-cpp-python` |
| UI | `pywebview` + HTML/CSS/JS |
| 全域快捷鍵 | `pywin32` (Windows) / `pynput` (macOS、Linux) |
| 剪貼簿 | `pyperclip` |
| 打包 | `PyInstaller` |

---

## 目錄結構

```
dictionary/
├── main.py              # 入口點
├── llm/
│   ├── engine.py        # 模型封裝與對話邏輯
│   └── prompts.py       # System prompt
├── web/                 # 前端 HTML/CSS/JS
│   ├── popup.html       # 查詢 + 聊天視窗
│   ├── settings.html    # 設定面板
│   ├── setup.html       # Setup Wizard
│   ├── style.css        # 共用樣式
│   └── app.js           # 前端邏輯
├── ui/
│   ├── window.py        # PyWebView 視窗管理
│   └── tray.py          # 系統匣圖示
├── core/
│   ├── hotkey.py        # 全域快捷鍵
│   ├── clipboard.py     # 剪貼簿讀取
│   └── config.py        # 設定儲存
└── assets/
    └── icon.png
```

---

## 開發路線圖

- [ ] v1 — 核心查詢、追問聊天、快捷鍵、打包
- [ ] v2 — 單字記錄與查詢歷史
- [ ] v3 — 單字卡複習模式
- [ ] v4 — 語音發音（TTS）
