# 高併發 RAG 知識庫問答服務

## 專案定位

這是一個用來展示高併發系統設計與效能優化能力的作品集專案。業務只做一件事：**使用者對一份知識庫提問，服務找出相關資料並回傳附來源的答案。**

業務規則保持簡單，工程挑戰放在大量問題同時進入時，如何有效檢索、控制模型服務負載、降低延遲與成本，並讓系統在依賴服務變慢或失效時維持穩定。

## 業務範圍

- 系統管理一份預先建立的知識庫；文件切分後以 SQLite 保存，第一版使用 SQLite FTS 全文檢索，避免一開始引入獨立向量資料庫。
- 使用者送出問題，系統找出相關文字片段，交由生成模型整理成答案。
- 回答需附上引用片段及文件來源；找不到足夠相關資料時，明確回覆目前資料不足。
- 不處理多租戶、複雜權限、文件審批、聊天工作流或商業交易。

## 核心工程問題

1. **高併發檢索**：大量請求同時查詢知識片段時，如何控制連線、併發和尾端延遲。
2. **模型容量管理**：模型服務速度有限時，如何排隊、限流、取消過期請求及避免資源耗盡。
3. **避免重複工作**：對相同問題或相同檢索條件，評估快取是否能降低延遲與模型呼叫量。
4. **穩定的端到端延遲**：分別量測排隊、檢索、重排、生成及串流時間，找出真正瓶頸。
5. **降級與恢復**：向量資料庫或模型服務暫時不可用時，回傳可理解的錯誤並限制故障擴大。
6. **答案可核對**：保存檢索到的來源，驗證引用確實對應知識庫片段，不以回答流暢度取代品質檢查。

## API 草案

| 方法 | 路徑 | 用途 |
| --- | --- | --- |
| `POST` | `/api/questions` | 提問並取得答案；可選擇串流回覆 |
| `GET` | `/api/requests/{requestId}` | 查詢排隊中或處理中的請求狀態 |
| `GET` | `/actuator/health` | 健康檢查 |
| `GET` | `/api/benchmark/compare?q=Normandy&runs=10` | 比較 SQLite 查詢與每次重新解析 JSON 的搜尋時間 |

同步處理時回傳答案、引用和耗時資訊。若採佇列模式，提交後回傳 `202 Accepted` 與 `requestId`，請求狀態為 `QUEUED`、`PROCESSING`、`COMPLETED` 或 `FAILED`。過載時回傳一致的繁忙錯誤或排隊結果，不讓請求無限制堆積。

## 程式資料夾架構

Java 程式使用 `com.unus.one` 作為 package 根目錄，依技術層分資料夾。這和 C# 常見的 Controller → Service → Repository 分層相近：

```text
src/main/java/com/unus/one/
├── config/       # 共用設定
├── controller/   # HTTP 路由與請求處理，例如 @GetMapping
├── service/      # 問答流程與應用程式邏輯
├── repository/   # 知識文件、片段等資料存取
├── model/        # 領域模型或資料實體
├── dto/          # API 請求與回應資料格式
└── exception/    # 例外與錯誤處理

src/main/resources/ # application.properties、templates/、static/ 等資源
src/test/java/com/unus/one/ # 測試程式
```

請求流程為 `HTTP request → Controller → Service → Repository → Service → Controller → HTTP response`。例如 Controller 以 `@GetMapping` 對應 GET 路徑，呼叫 Service 執行問答流程，再將結果整理成 DTO 回傳。Service 負責協調檢索與生成等工作，Repository 封裝知識資料存取。

目前 `OneApplication` 與既有 `HealthController` 位於 `com.unus.one` 根 package；新功能依上述分層放入對應資料夾。
## RAG 示範資料集

`data/squad-demo.sqlite3` 是由 Stanford SQuAD 2.0 官方 dev split 匯入的 SQLite 示範資料庫，包含 35 篇文件、1,204 個段落 chunks、11,873 個問題。資料集同時包含無法由段落回答的問題，可用來練習檢索與拒答。


### 資料表一覽

資料庫共有 **5 張資料表**：4 張保存文件與 QA 資料，`dataset_metadata` 保存資料集來源與授權資訊。

| 資料表 | 用途 | 欄位 | 資料範例（取自 SQLite） |
| --- | --- | --- | --- |
| `documents` | 知識來源文件 | `document_id` TEXT **PK**：文件 ID；`title` TEXT：文章標題；`source_url` TEXT：Wikipedia 來源網址；`attribution` TEXT：資料歸屬；`license` TEXT：授權名稱 | `document_id=squad-v2-dev-000`<br>`title=Normans`<br>`source_url=https://en.wikipedia.org/wiki/Normans`<br>`attribution=Rajpurkar et al., Stanford Question Answering Dataset; source passages are Wikipedia articles`<br>`license=CC BY-SA 4.0` |
| `chunks` | 文件段落，作為檢索單位 | `chunk_id` TEXT **PK**：段落 ID；`document_id` TEXT **FK → documents.document_id**：所屬文件；`chunk_index` INTEGER：文件內段落序號；`content` TEXT：段落全文 | `chunk_id=squad-v2-dev-000-p0000`<br>`document_id=squad-v2-dev-000`<br>`chunk_index=0`<br>`content="The Normans (Norman: Nourmands; French: Normands; Latin: Normanni) were the people who in the 10th and 11th centuries ga…"`（節錄） |
| `questions` | 對應段落的問題與是否可回答 | `question_id` TEXT **PK**：問題 ID；`chunk_id` TEXT **FK → chunks.chunk_id**：問題所屬段落；`question` TEXT：問題文字；`is_answerable` INTEGER：是否可由段落回答，`1` 是、`0` 否 | 可回答：`question_id=56ddde6b9a695914005b9628`；`chunk_id=squad-v2-dev-000-p0000`；`question=In what country is Normandy located?`；`is_answerable=1`<br>不可回答：`question_id=5a0c6698f5590b0018dab3e4`；`chunk_id=squad-v2-dev-010-p0000`；`question=Amazonia or the Amazon jungle are no longer used to refer to what?`；`is_answerable=0` |
| `answers` | 問題的參考答案及其在段落中的位置 | `answer_id` INTEGER **PK**：自動遞增 ID；`question_id` TEXT **FK → questions.question_id**：所屬問題；`answer_text` TEXT：答案文字；`answer_start` INTEGER：答案在段落 `content` 中的起始字元位置 | `answer_id=1`<br>`question_id=56ddde6b9a695914005b9628`<br>`answer_text=France`<br>`answer_start=159` |
| `dataset_metadata` | 資料集匯入與授權資訊 | `key` TEXT **PK**：metadata 名稱；`value` TEXT：metadata 值，例如版本、split、來源網址、SHA-256 與授權 | `key=dataset`<br>`value=Stanford Question Answering Dataset (SQuAD) v2.0`<br>另一筆：`key=license`；`value=CC BY-SA 4.0` |

### 資料表關聯

| 一方 | 關係 | 多方 | 說明 |
| --- | --- | --- | --- |
| `documents.document_id` | 1 對多 | `chunks.document_id` | 一篇來源文件含多個段落 chunks |
| `chunks.chunk_id` | 1 對多 | `questions.chunk_id` | 一個段落可對應多個問題 |
| `questions.question_id` | 1 對多 | `answers.question_id` | 一個問題可有多個參考答案；不可回答的問題沒有答案列 |
| `dataset_metadata` | 獨立 | — | 以 key/value 保存匯入資料集的整體 metadata，不連到個別文件 |

資料來源、授權、歸屬資訊及重建方式見 [`data/README.md`](data/README.md)；匯入程式為 [`scripts/import_squad_demo.py`](scripts/import_squad_demo.py)。資料集採 CC BY-SA 4.0，重新散布時須保留歸屬與相同授權。
目前 benchmark API 已讀取 SQLite demo DB 與來源 JSON；RAG 問答 API 尚未實作。

### 搜尋效能比較 API

呼叫 `GET /api/benchmark/compare?q=Normandy&runs=10`，會透過同一個 Controller／Service 流程比較兩種搜尋方式，回傳匹配段落數、前 5 筆結果預覽、每輪耗時，以及平均值、中位數、最小值和最大值（微秒）。`runs` 預設為 10，允許 1 到 100。

- **SQLite JDBC**：每輪建立連線，對 `chunks.content` 做不分大小寫的子字串掃描，並連接文件標題。
- **JSON parser**：每輪重新讀取並解析 SQuAD JSON，再逐段掃描 `context`。
- 每種方式各做一次不計時暖身，計時順序逐輪交替。測量包含資料讀取和搜尋，不包含 HTTP 回應序列化；這是本機 demo 的簡單量測，不能直接當成正式環境的效能結論。

成功回應中的 `sqlite` 和 `jsonParser` 會提供相同格式的結果，便於對照。例如：

```text
GET http://localhost:8080/api/benchmark/compare?q=Normandy&runs=10
```

測試會透過 MockMvc 呼叫此 API，檢查兩種方式的結果數一致、樣本耗時有回傳，以及空白查詢和超出範圍的 runs 會被拒絕。測試不斷言哪一種一定比較快，因為執行環境和檔案快取會影響耗時。
## 演進架構

### 里程碑一：建立正確基線

以 Spring Boot 提供問答 API，使用 SQLite + ORM 保存文件與片段，透過 FTS 全文檢索找出候選內容，再串接一個生成模型。先固定文件集、切塊方式、檢索參數與模型版本，量測單請求流程及答案引用品質。

### 里程碑二：找出併發瓶頸

逐步增加並行請求，分別記錄 API、SQLite 檢索、模型生成的吞吐量與 p50/p95/p99 延遲。確認瓶頸來自應用程式執行緒、SQLite 讀寫、連線池還是模型容量，再針對測量結果調整。

### 里程碑三：保護有限資源

加入有界併發、請求佇列、逾時、取消、限流及背壓。設定佇列容量與最大等待時間，確保過載時能快速回覆，而不是讓延遲無限增加。

### 里程碑四：降低重複成本

評估問題正規化後的答案快取、檢索結果快取及批次檢索。快取鍵需包含知識庫版本和檢索／生成設定，避免資料或設定更新後回傳過期答案。以命中率及答案品質確認快取效益。

### 里程碑五：故障與品質驗證

模擬模型變慢或中斷、SQLite busy／鎖競爭、請求取消及服務重啟。檢查系統能否限制佇列、釋放資源、回報狀態，並確保答案引用來自檢索結果。

## 高併發設計概念

以下概念會沿著一次問答請求的生命週期實作與比較，並以壓測數據驗證效果。不是每個元件都必須一開始導入；先有基線，再根據瓶頸加入對應機制。

| 概念 | 在本服務中的用法 | 要避免的問題 |
| --- | --- | --- |
| 有界併發與 Semaphore | 限制同時進入向量檢索、重排及模型生成的請求數；不同下游可設定不同上限 | 執行緒、記憶體或模型工作槽被塞滿 |
| 背壓與有界佇列 | 下游繁忙時暫存有限數量請求；佇列滿或等待過久時拒絕／降級。學習版以 `ReentrantLock` + `Condition` 實作 `notEmpty` / `notFull`，再和 `ArrayBlockingQueue` 比較 | 無限排隊造成延遲持續上升與資源耗盡 |
| Admission control | 進入昂貴檢索或生成前，依併發額度、佇列長度和期限決定接收或快速回覆繁忙 | 已無法在期限內完成的工作仍消耗資源 |
| 隔艙（Bulkhead） | 將向量資料庫、重排器、模型服務使用的執行緒／連線額度分開 | 單一下游變慢拖垮整個服務 |
| 逾時、取消與 deadline 傳遞 | 將請求剩餘期限傳到檢索、重排及生成；客戶端離線或逾時後停止可取消工作 | 已無人等待的請求繼續占用昂貴資源 |
| 平行扇出與結果合併 | 比較一次查詢多個索引／檢索通道的平行執行，再合併候選片段 | 串行等待增加延遲；無限制扇出放大下游流量 |
| 批次查詢 | 將短時間內多個 embedding 或向量查詢合併成批次，設定最大批次大小和等待窗口 | 單筆呼叫成本過高，或為湊批次引入過多延遲 |
| 連線池與資源池 | 分別設定 HTTP、向量資料庫及模型連線池容量，觀察等待時間和使用率 | 連線耗盡、池過大造成下游過載 |
| 快取與請求合併（single-flight） | 快取相同檢索結果；相同問題在短時間同時到達時合併一次進行中的計算 | 熱門問題重複查詢，或快取失效瞬間大量回源 |
| 快取防擊穿與版本隔離 | 對熱門 key 使用短暫互斥／隨機過期時間；key 納入知識庫版本及檢索設定 | 快取同時過期造成尖峰，或文件更新後命中舊答案 |
| 降載與熔斷 | 依錯誤率、延遲和佇列狀態暫停呼叫故障下游，必要時只回傳檢索來源或繁忙訊息 | 故障重試形成流量風暴並擴大故障 |
| 負載測試與容量估算 | 分別做穩定併發、逐步升壓、突發流量和長時間測試 | 只看平均延遲，忽略尾端延遲與容量極限 |

### Condition Lock 實作練習

自製固定容量的 `BoundedRequestQueue`，使用一個 `ReentrantLock` 保護佇列狀態，並建立兩個 `Condition`：`notEmpty` 與 `notFull`。

- 消費者在鎖內用 `while (queue.isEmpty()) notEmpty.await()` 等待工作；生產者放入工作後呼叫 `notEmpty.signal()`。
- 生產者在鎖內用 `while (queue.size() == capacity) notFull.await()` 等待空位；消費者取走工作後呼叫 `notFull.signal()`。
- `await()` 等待時會釋放鎖，醒來後重新取得鎖；條件必須用 `while` 重查，以處理虛假喚醒及多個消費者競爭。
- 透過 `try/finally` 釋放鎖，保留中斷語意，並定義 queue 關閉時如何喚醒所有等待者。
- 鎖只保護佇列入列、出列和關閉狀態；不得在持鎖期間呼叫 SQLite、檢索服務或生成模型。
- 這是學習同步原語的比較實作；服務預設可使用 `ArrayBlockingQueue`。以同一組 producer/consumer 負載比較吞吐量、等待延遲、CPU 消耗與正確性。

### 一次請求的處理路徑

```text
問題請求
  -> Admission control / 使用者限流
  -> 相同請求合併或快取查詢
  -> 有界檢索併發
  -> 平行檢索與有限批次
  -> 候選片段合併／重排
  -> 有界模型併發與生成
  -> 附引用答案；逾時、過載或依賴失效時明確降級
```

每個階段都需傳遞同一個 deadline、request id 和取消訊號，並分別記錄等待時間與執行時間。這樣才能分辨延遲來自排隊、向量檢索、重排或模型生成，而不是只調整一個全域執行緒池。

### 優化比較順序

1. 先以同步、單次檢索建立正確性和延遲基線。
2. 加入量測，找到主要瓶頸及下游可承受容量。
3. 逐項加入有界併發、超時與背壓，確認過載時延遲和資源仍有上限。
4. 再評估平行檢索、批次、快取和請求合併，記錄吞吐量、p95/p99、成本與引用品質的變化。
5. 以突發流量及下游故障驗證降載、熔斷和恢復；每項優化都保留可重現的前後數據。
## 預期元件

- Java 25、Spring Boot、Gradle Kotlin DSL
- SQLite + ORM（例如 Spring Data JPA）：儲存知識庫文件、片段及必要的請求狀態；先使用單一本機資料庫檔案，避免維運多個資料服務
- SQLite FTS：提供第一版全文檢索；FTS 查詢封裝在檢索 adapter，文件與一般資料仍透過 ORM 存取。ORM 有助於隔離一般 CRUD，但不會抹平各資料庫的全文檢索、鎖定和併發差異
- 生成模型：根據檢索片段生成答案
- Redis：非必要，只有單機快取／限流不足且量測支持時才加入
- Micrometer／Actuator：觀察請求延遲、佇列深度、錯誤率及依賴服務狀態
- k6 或 Gatling：重現並發負載與突發流量
- Docker Compose：提供本機可重現的依賴服務

SQLite 適合讓本機開發和部署保持簡單，但單一 SQLite 資料庫同一時間只能有一個 writer；WAL 可讓讀取與寫入並行，不能讓多個 writer 同時提交。因此本專案把高併發重點放在讀取檢索、模型呼叫及有界排隊，也會量測寫入鎖等待；不把 SQLite 的結果宣稱為多節點高寫入能力。ORM 隔離業務層與資料存取細節，但 SQLite 與其他資料庫的鎖定及併發特性仍不同。

## 設計取捨與面試說明

- **為什麼選 SQLite？** 專案先聚焦併發控制、檢索流程和模型服務，不把時間花在架設資料庫叢集。SQLite 足以支援本機可重現的讀取型 RAG 基線；測試仍會揭露單 writer 對寫入的限制。
- **ORM 是否代表可以無成本換資料庫？** ORM 可讓一般 CRUD 和領域邏輯少依賴特定資料庫，但 FTS 查詢、索引、交易與鎖定語意仍可能不同。以 repository／adapter 隔離差異，換庫時仍需調整實作並重新驗證。
- **為什麼先用 FTS，不先加向量資料庫？** 固定知識庫下，FTS 能提供低依賴、容易重現的檢索基線；它偏向詞彙匹配，語意檢索能力有限。先量測檢索品質，確認需要語意搜尋後，再把檢索 adapter 換成向量方案。
- **為什麼研究 Condition lock？** 自製有界佇列能展示 `ReentrantLock`、`Condition`、`await`／`signal`、虛假喚醒與關閉流程；正式預設使用成熟的 `ArrayBlockingQueue`，並用壓測比較，避免把自製同步原語當成天然更快或更安全。
- **這個佇列能否跨程序或重啟保存工作？** 不能。Condition 佇列是單一 JVM 的記憶體結構，程序結束時工作會消失；本專案先用它學習背壓與執行緒協作，若需求轉為持久化任務，再獨立評估資料庫佇列或訊息系統。
- **高併發優化的證據是什麼？** 同一負載下比較吞吐量、p95/p99、佇列等待、資源使用、SQLite 鎖等待及答案引用品質；只在量測顯示改善且正確性不退步時，才保留優化。

目前程式仍是 Spring Boot 起始範本；以上是目標規格與演進路線，尚未代表這些元件已實作。

## 效能與品質驗收

每輪壓測固定文件集、問題集、模型版本、硬體／容器限制、預熱方式和測試時長，記錄：

- 每秒請求數、成功率、超時率及錯誤率
- p50、p95、p99 端到端延遲，以及排隊、檢索、生成各階段耗時
- CPU、記憶體、連線池使用量、佇列深度與最老請求等待時間
- 模型呼叫數、快取命中率及每題成本估算
- 檢索命中品質、引用正確性，以及資料不足時是否正確拒答

先建立可重現的基線，再記錄每項優化前後的數據與代價。不預先捏造吞吐量、延遲或答案品質承諾。效能提升不能以引用錯誤或拒答能力退步為代價。

## 執行目前範本

需要 Java 25 JDK；使用專案內 Gradle Wrapper：

```powershell
./gradlew.bat bootRun
```

目前範本健康檢查：`GET http://localhost:8080/api/health`。

```powershell
./gradlew.bat test
```

這份 README 描述預定完成的作品集專案。只有在相應功能、壓測和品質檢查實際完成後，才應把它們列為已交付成果。
