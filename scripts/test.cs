using System.Text.Json;
/*
C# 綜合語法練習：支出審核與預算分析工具

一、目標與完整流程

寫一個單檔 C# 腳本，讀取支出與預算，整理資料、辨識付款狀態、
分析預算，最後輸出文字與 JSON 報表。

完整資料流：
    在腳本開頭設定檔案路徑與月份
        ↓
    非同步讀取兩份 JSON
        ↓
    轉成物件、檢查資料
        ↓
    清理文字、備註與標籤
        ↓
    選出指定月份的支出
        ↓
    區分已付款、待付款、已取消
        ↓
    按類別彙整已付款金額
        ↓
    比對預算、判斷預算狀態
        ↓
    建立報表物件
        ↓
    透過共同介面輸出文字與 JSON

難度放在把多種 C# 語法接起來使用。
計算只有加總、減法和百分比。
你自己決定如何拆方法、設計資料型別與組織程式。

二、輸入資料

全部處理邏輯寫在這個 test.cs，使用 .NET 10 的單檔執行方式及標準函式庫。
在 scripts 資料夾執行：

    dotnet run --file test.cs

主流程使用頂層陳述式；需要的 class、record、enum、interface 與擴充方法
也宣告在同一個檔案中，型別宣告放在主流程之後。
啟用 nullable reference types，可在實作開頭加入 #nullable enable。
以下 JSON 是練習用的虛構資料；實作時自行建立對應的輸入檔案。

在腳本開頭以變數設定支出檔路徑、預算檔路徑及月份，例如：

    支出檔：expenses.json
    預算檔：budgets.json
    月份：2026-10

兩份 JSON 放在 scripts 資料夾，範例相對路徑以執行時的工作目錄為基準。
執行後直接完成讀取、整理與報表輸出；改月份時修改腳本中的月份變數。

支出檔 expenses.json：
日期與金額刻意使用字串，讓你練習轉換與檢查。

[
  {"id":"E001","date":"2026-10-01","category":" 餐飲 ","item":" 早餐 ","amount":"60","status":"Paid","note":null,"tags":[" 早餐 ","餐飲","早餐"]},
  {"id":"E002","date":"2026-10-02","category":"交通","item":"捷運","amount":"40","status":"Paid","note":" ","tags":[]},
  {"id":"E003","date":"2026-10-02","category":"餐飲","item":"午餐","amount":"120","status":"Paid","note":"公司附近","tags":null},
  {"id":"E004","date":"2026-10-03","category":"日用品","item":"洗衣精","amount":"180","status":"Paid","note":null,"tags":["生活"]},
  {"id":"E005","date":"2026-10-04","category":"娛樂","item":"電影","amount":"300","status":"Pending","note":null,"tags":[]},
  {"id":"E006","date":"2026-10-04","category":"餐飲","item":"咖啡","amount":"80","status":"Paid","note":"","tags":["咖啡"]},
  {"id":"E007","date":"2026-09-30","category":"餐飲","item":"晚餐","amount":"150","status":"Paid","note":null,"tags":[]},
  {"id":"E008","date":"2026-10-05","category":"交通","item":"公車","amount":"25","status":"Cancelled","note":null,"tags":[]},
  {"id":"E009","date":"2026-10-05","category":"交通","item":"計程車","amount":"abc","status":"Paid","note":null,"tags":[]},
  {"id":"E010","date":"2026-13-01","category":"餐飲","item":"晚餐","amount":"100","status":"Paid","note":null,"tags":[]},
  {"id":"E011","date":"2026-10-06","category":"學習","item":"書籍","amount":"200","status":"Paid","note":"C# 練習","tags":["學習"]},
  {"id":"E012","date":"2026-10-07","category":"餐飲","item":"晚餐","amount":"60","status":"Unknown","note":null,"tags":[]}
]

預算檔 budgets.json：
預算代表每月各類別的支出上限。

{
  "餐飲": 300,
  "交通": 50,
  "日用品": 150,
  "娛樂": 500
}

三、資料整理與驗證規則

1. id、類別及品項移除前後空白，整理後不可空白。
2. 日期須符合 yyyy-MM-dd 且為有效日期；轉成 DateOnly。
3. 金額須為大於零的數字；以 decimal 保存。
4. 付款狀態只接受 Paid、Pending、Cancelled，轉成 enum。
5. 備註移除前後空白；空字串或純空白統一成 null。
6. 標籤移除前後空白、丟棄空標籤、移除重複值；保留首次出現的順序。
   null 標籤視為空集合。
7. 不合法的支出記錄錯誤並跳過，繼續處理其他資料。
   檢查順序：ID、日期、類別、品項、金額、狀態。
   每筆只記第一個問題，並保留原始資料的筆次與 ID。
8. 預算的類別不可空白、金額必須大於零。
   預算有錯時停止產生報表。

四、中階與進階語法要求

每一項都必須用在實際資料流中，不能只另外寫一段展示語法。

1. class、屬性、物件初始化
   保存從 JSON 讀入的原始支出。

2. record、with
   保存轉換後的支出，透過複製建立清理後的版本。

3. enum
   表達付款狀態及預算狀態。

4. nullable、?.、??
   整理可空備註與標籤；顯示備註時提供預設文字。

5. 泛型方法
   同一個 JSON 讀取方法，分別讀取支出清單與預算字典。

6. 擴充方法
   篩選指定月份，以及選出已付款支出；主流程實際呼叫它們。

7. lambda、LINQ
   篩選、投影、分組、加總、排序與標籤去重。

8. Dictionary、TryGetValue
   查詢各類別的預算。

9. switch 表達式、模式比對
   判斷並顯示預算狀態。

10. 介面、多型
    用共同的報表輸出介面，呼叫文字與 JSON 兩種輸出器。

11. async／await、Task<T>
    讀取輸入檔及寫入報表。

12. try／catch
    處理檔案與 JSON 格式錯誤。

五、篩選、彙整與預算計算

1. 統計全部來源的有效及錯誤筆數，再篩選指定月份。
2. 分別計算該月三種付款狀態的筆數和金額。
3. 只有 Paid 計入實際支出與預算使用率。
4. 每個設定了預算的類別都出現在報表。
   額外出現的本月支出類別也要列出。
   類別按名稱的 ordinal 順序排列。
5. 剩餘預算 = 預算 - 已付款金額，允許負數。
6. 使用率 = 已付款金額 ÷ 預算 × 100。
   顯示至兩位小數，四捨五入採 AwayFromZero。
7. 預算狀態用未四捨五入的使用率判斷：
   - 沒有設定預算：未設定。
   - 使用率低於 80%：正常。
   - 使用率介於 80% 至 100%，含兩端：接近上限。
   - 使用率超過 100%：超支。
8. 沒有預算的類別，預算、剩餘及使用率在 JSON 中保存為 null，
   文字報表顯示「—」。

六、報表物件與輸出格式

建立一個共同報表物件，內容包含：
    - 月份。
    - 來源、有效、錯誤及本月筆數統計。
    - 三種付款狀態的筆數及金額摘要。
    - 類別摘要：類別、已付款筆數、已付款金額、預算、剩餘、使用率、狀態。
    - 本月已付款明細：ID、日期、類別、品項、金額、狀態、備註、標籤。
    - 全部來源資料的錯誤：原始筆次、ID、原因。

明細按日期排序，同日期保留來源順序。

兩個輸出器都接收這個報表物件，在支出檔旁的 output 資料夾產生：
    report-2026-10.txt
    report-2026-10.json

月份隨腳本開頭的設定變數改變；同月份重跑覆寫結果。
output 資料夾不存在時建立它。
兩份檔案皆使用 UTF-8。
JSON 使用 camelCase 欄位名稱、縮排排版，日期保存為 yyyy-MM-dd。
JSON 的整理後備註保留 null；文字報表的無備註顯示「無備註」。
文字報表的金額固定兩位小數，包含摘要、類別摘要、已付款明細與錯誤紀錄。

七、範例預期結果

設定月份為 2026-10，摘要必須得到：

    來源：12 筆
    有效：9 筆
    錯誤：3 筆
    本月：8 筆

    已付款：6 筆，680.00
    待付款：1 筆，300.00
    已取消：1 筆，25.00

類別摘要內容如下，實際輸出按指定的 ordinal 排序規則排列：

    類別   | 已付款筆數 | 已付款金額 | 預算   | 剩餘   | 使用率  | 狀態
    餐飲   | 3          | 260.00     | 300.00 | 40.00  | 86.67%  | 接近上限
    交通   | 1          | 40.00      | 50.00  | 10.00  | 80.00%  | 接近上限
    日用品 | 1          | 180.00     | 150.00 | -30.00 | 120.00% | 超支
    娛樂   | 0          | 0.00       | 500.00 | 500.00 | 0.00%   | 正常
    學習   | 1          | 200.00     | —      | —      | —       | 未設定

已付款明細依序為：
    E001、E002、E003、E004、E006、E011。

資料清理結果：
    E001 的類別為「餐飲」、品項為「早餐」、標籤為 ["早餐","餐飲"]。
    E002 和 E006 的備註整理成 null。
    E003 的標籤整理成空集合。

錯誤紀錄：
    第 9 筆 E009：金額須為大於 0 的數字
    第 10 筆 E010：日期格式或日期值無效
    第 12 筆 E012：付款狀態無效

八、其他驗收情境

1. 查 2026-09：已付款一筆，總額 150.00。
2. 查沒有資料的月份：各付款摘要為零，設定的預算類別仍要顯示。
3. 把餐飲預算改成 260：使用率 100.00%，狀態「接近上限」。
4. 設定不符合 yyyy-MM 的月份：顯示原因並結束腳本。
5. 輸入檔不存在、JSON 損壞或預算無效：顯示原因並停止。
6. 支出清單為空或全部資料無效：仍產生零筆摘要及相應錯誤紀錄。
7. 寫入失敗：顯示失敗的檔案；兩份報表都成功後才顯示完成。
8. 兩種報表必須來自同一個報表物件，統計及明細內容一致。

完成標準：
    資料流結果正確，而且你能解釋每種指定語法，
    在這個工具裡解決了哪個問題。
*/

public record Expense(string id, string date, string category, string item, string amount, string status, string note, string[] tags);
public record Budget(string foods, string transportation, string daily, string entertainment);

class Program(string budgetPath, string expensePath)
{
  public void Main()
  {
    if (File.Exists(expensePath))
    {
      var expenses = JsonSerializer.Deserialize<List<Expense>>(File.ReadAllText(expensePath));
    }

    if (File.Exists(budgetPath))
    {
      var budgets = JsonSerializer.Deserialize<Budget>(File.ReadAllText(budgetPath));
    }



  }

}
