# Pure Backend Side Project 練習筆記

## 目標

做一個不含前端的 .NET backend side project，透過實際功能練習依賴注入（DI）、C# 集合操作、LINQ 與 Entity Framework Core。重點是熟悉從 API 請求到資料庫查詢與保存的完整流程，並理解每個元件的責任。

## 專案方向

先做一個「個人藏書管理 API」：管理書籍、作者、標籤與閱讀狀態。這個範圍足以練習一對多與多對多關聯、查詢篩選、排序及分頁，也能逐步增加功能而不需要前端。

## 練習內容

- **DI**：讓 Controller 依賴 Service 介面，Service 依賴 Repository 或 `DbContext`；練習註冊生命週期與建構子注入。
- **List 與 Dictionary**：用 `List<T>` 整理輸入或查詢結果；用 `Dictionary<TKey, TValue>` 建立快速查找索引、計數或分組結果，並理解何時適合各自使用。
- **LINQ**：練習 `Where`、`Select`、`OrderBy`、`GroupBy`、`Any`、`FirstOrDefault`、`ToDictionary`，以及延遲執行與立即執行的差異。
- **EF Core**：建立 Entity 與關聯、設定 `DbContext`、使用 Migration，完成新增、更新、刪除、條件查詢與投影；留意追蹤查詢、`AsNoTracking` 和非同步資料庫操作。
- **Backend 分層**：從 API endpoint 進入應用服務，再由 EF Core 存取資料；讓每層只負責清楚的一段工作。

## 建議實作順序

1. 建立 ASP.NET Core Web API，先用記憶體中的 `List<Book>` 實作新增、取得清單與依 ID 查詢。
2. 將操作移到 Service，透過介面與 DI 注入；加入修改、刪除及基本輸入驗證。
3. 加入標籤、狀態篩選、排序與分頁，使用 LINQ 完成查詢；另外用 Dictionary 做一個合適的查找或統計功能。
4. 將記憶體儲存改為 EF Core 與 SQLite，建立 Migration，讓 API 資料在程式重啟後仍保留。
5. 加入作者與標籤關聯，練習關聯載入、資料投影及避免不必要的資料庫往返。
6. 為 Service 或資料存取行為補上少量測試，確認 DI 註冊和主要查詢能正常運作。

## 完成標準

- API 能新增、查詢、修改與刪除書籍。
- 能依閱讀狀態或標籤篩選，並支援排序及分頁。
- 資料由 EF Core 保存至 SQLite，重新啟動後仍存在。
- 能說明 DI 如何建立物件及傳遞依賴，也能說明一個 LINQ 查詢如何轉成 EF Core 資料庫查詢。
- 能指出 List、Dictionary、LINQ 與 EF Core 在專案中各自解決的問題。

## 先採用的範圍

先維持單一 ASP.NET Core Web API、SQLite 與清楚的分層，不急著加入登入、部署、訊息佇列或微服務。等核心 CRUD 與查詢流程完成後，再依實作中遇到的需求擴充。
