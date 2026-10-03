// Exercise: Default Constructors
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use a default Book constructor that assigns the required default values.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use a default Book constructor that assigns the required default values.
public class Solution
{
    public static string GetBookInfo()
    {
    }
}

/*
Answer:

// Task: Default Constructors
// Use a default Book constructor that assigns the required default values.

public class Book
{
    public string Title;
    public string Author;
    public int PageCount;
    public bool IsAvailable;

    public Book()
    {
        Title = "Untitled";
        Author = "Unknown";
        PageCount = 0;
        IsAvailable = true;
    }
}

public class Solution
{
    public static string GetBookInfo()
    {
        Book book = new Book();
        return $"{book.Title}, {book.Author}, {book.PageCount}, {book.IsAvailable}";
    }
}
*/
