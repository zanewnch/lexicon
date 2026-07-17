# IELTS Speaking 素材來源說明

這份文件說明目前專案裡的 IELTS Speaking 題庫素材是怎麼找到、怎麼收集、以及目前資料的狀態。

## 目前素材在哪裡

目前收集到的 Speaking 題庫素材放在：

```text
data/ielts/external/ieltsbro/oral_topics.json
```

這份 JSON 是從 IELTS Bro 的公開 question bank 頁面整理出的口說題目列表資料。

來源頁面：

```text
https://www.ieltsbro.com/question-bank/
```

## 怎麼找到素材

我先在 `docs/ielts/resources.md` 裡整理 IELTS 學習資源時，把 IELTS Bro 標記成「適合中文學習者參考的 Speaking question bank」來源。它的用途是幫我們知道近期口說題目有哪些，而不是拿來複製或散佈完整第三方內容。

接著我打開 IELTS Bro 的 question bank 頁面，觀察前端頁面載入題庫時用到的網路請求。頁面本身會向 IELTS Bro 的後端 API 要口說題目列表，所以我沒有去破解登入、付費內容或隱藏頁面，而是只讀取公開頁面正常載入時使用的公開列表資料。

目前抓取腳本使用的主要 API 是：

```text
https://hcp-server.ieltsbro.com/hcp/qsBank/oralTopic/listV3
```

腳本會用不同參數取得：

```text
Part 1
Part 2/3
all
people
things
events
places
```

## 用什麼工具收集

目前使用的腳本是：

```text
tools/ielts/scrape_ieltsbro.py
```

它用 Playwright 開啟 IELTS Bro 的公開 question bank 頁面，再呼叫同一個前端會用到的公開 API，把題目列表整理成 JSON。

可以用這個方式重新收集：

```powershell
python tools/ielts/scrape_ieltsbro.py --all --delay 1.5
```

## 目前收集到什麼

目前檔案裡原始資料有 `212` 筆，但其中一半是同一題同時出現在 `all` 和細分類中。

去重後，真正不同的 Speaking topics 是：

```text
共 106 個 topics
Part 1：46 個
Part 2/3：60 個
新題：49 個
```

分類大致如下：

```text
people：14
things：51
events：27
places：14
```

目前高頻題包含：

```text
Watch
Cars
Websites
Mirrors
Work or studies
收到特殊蛋糕
为家人骄傲
Public gardens and parks
Teachers
Views
Shopping
The area you live in
Music
Home & Accommodation
```

## 這份資料包含哪些欄位

每一筆 topic 目前大概包含：

```text
source
category
part
oral_topic_id
oral_topic_name
question_count
sample_question
recent_exam_count
oral_nums
time_tag
is_new
raw
```

其中比較重要的是：

```text
oral_topic_name：題目主題
sample_question：代表題目或 Part 2 cue card
part：Part 1 或 Part 2/3
category：people / things / events / places
question_count：這個 topic 底下有幾個問題
recent_exam_count：近期出現次數或熱度指標
is_new：是否為新題
time_tag：題庫季節，例如 2026 年 5-8 月
```

## 使用邊界

這份資料只用於個人學習索引和練習規劃。

目前腳本沒有做這些事：

```text
沒有登入帳號
沒有繞過付費牆
沒有抓音檔
沒有抓完整解析或範文
沒有抓會員限定內容
```

也不建議把 IELTS Bro 的完整題庫、音檔、解析、範文或付費內容重新散佈出去。

比較適合的使用方式是：

```text
整理自己的每日練習清單
標記高頻題和新題
寫自己的回答草稿
記錄弱點
產生自己的 speaking drill
```

## 下一步整理方向

目前 `oral_topics.json` 還是原始題庫格式，不是最適合直接讀的學習表。

下一步可以把它轉成：

```text
study-materials.md
speaking-topics.csv
daily-speaking-plan.md
```

建議先整理成三層：

```text
第一層：高頻必練題
第二層：新題優先題
第三層：分類練習題
```

這樣就能從「素材收集」進到「每天實際練什麼」。
