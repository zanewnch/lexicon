using System;

// Exercise: Extension Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a string extension method that counts words separated by whitespace.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a string extension method that counts words separated by whitespace.
public class Solution
{
    public static int WordCount(this string text)
    {
    }
}

/*
Answer:

using System;

// Task: Extension Methods
// Create a string extension method that counts words separated by whitespace.

public static class StringExtensions
{
    public static int WordCount(this string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        return text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
    }
}
*/
