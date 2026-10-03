using System.IO;

// Exercise: Path Manipulation
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Combine a directory and filename, extract a filename, and extract a file extension.
//
// Methods and APIs to use:
// - Path.Combine
// - Path.GetFileName
// - Path.GetExtension
//
// Expected output:
// Combine a directory and filename, extract a filename, and extract a file extension.
public class Solution
{
    public static string BuildFilePath(string directory, string fileName)
    {
    }

    public static string GetFileNameFromPath(string filePath)
    {
    }

    public static string GetFileExtension(string filePath)
    {
    }
}

/*
Answer:

using System.IO;

// Task: Path Manipulation
// Combine a directory and filename, extract a filename, and extract a file extension.

public class Solution
{
    public static string BuildFilePath(string directory, string fileName)
    {
        return Path.Combine(directory, fileName);
    }

    public static string GetFileNameFromPath(string filePath)
    {
        return Path.GetFileName(filePath);
    }

    public static string GetFileExtension(string filePath)
    {
        return Path.GetExtension(filePath);
    }
}
*/
