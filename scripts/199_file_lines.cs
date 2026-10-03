using System.IO;

// Exercise: File Lines
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Read the file and return an array containing one string for each line.
//
// Methods and APIs to use:
// - File.ReadAllLines
//
// Expected output:
// Read the file and return an array containing one string for each line.
public class Solution
{
    public static string[] ReadFileLines(string filePath)
    {
    }
}

/*
Answer:

using System.IO;

// Task: File Lines
// Read the file and return an array containing one string for each line.

public class Solution
{
    public static string[] ReadFileLines(string filePath)
    {
        return File.ReadAllLines(filePath);
    }
}
*/
