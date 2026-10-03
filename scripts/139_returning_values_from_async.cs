using System.IO;
using System.Threading.Tasks;

// Exercise: Returning Values from Async
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Read a text file asynchronously and prefix its content with "Content: ".
//
// Methods and APIs to use:
// - File.ReadAllTextAsync
//
// Expected output:
// Read a text file asynchronously and prefix its content with "Content: ".
public class Solution
{
    public static async Task<string> ReadFileAsync(string filePath)
    {
    }
}

/*
Answer:

using System.IO;
using System.Threading.Tasks;

// Task: Returning Values from Async
// Read a text file asynchronously and prefix its content with "Content: ".

public class Solution
{
    public static async Task<string> ReadFileAsync(string filePath)
    {
        string content = await File.ReadAllTextAsync(filePath);
        return $"Content: {content}";
    }
}
*/
