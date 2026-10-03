using System.IO;

// Exercise: Checking File Existence
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the file contents when the file exists; otherwise return "File not found".
//
// Methods and APIs to use:
// - File.Exists
// - File.ReadAllText
//
// Expected output:
// Return the file contents when the file exists; otherwise return "File not found".
public class Solution
{
    public static string SafeReadFile(string filePath)
    {
    }
}

/*
Answer:

using System.IO;

// Task: Checking File Existence
// Return the file contents when the file exists; otherwise return "File not found".

public class Solution
{
    public static string SafeReadFile(string filePath)
    {
        return File.Exists(filePath) ? File.ReadAllText(filePath) : "File not found";
    }
}
*/
