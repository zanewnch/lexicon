using System;
using System.IO;

// Exercise: Writing Text Files
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Write the content to the provided path, then print the required
// confirmation line and content line in that order.
//
// Methods and APIs to use:
// - File.WriteAllText
// - Console.WriteLine
//
// Expected output:
// Write the content to the provided path, then print the required
// confirmation line and content line in that order.
public class Solution
{
    public static void WriteToFile(string filePath, string content)
    {
    }
}

/*
Answer:

using System;
using System.IO;

// Task: Writing Text Files
// Write the content to the provided path, then print the required
// confirmation line and content line in that order.

public class Solution
{
    public static void WriteToFile(string filePath, string content)
    {
        File.WriteAllText(filePath, content);
        Console.WriteLine($"Successfully wrote to {filePath}");
        Console.WriteLine($"Content: {content}");
    }
}
*/
