using System;

// Exercise: String Comparisons
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Compare strings with and without case sensitivity and return normalized ordering.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Compare strings with and without case sensitivity and return normalized ordering.
public class Solution
{
    public static bool AreEqualIgnoreCase(string text1, string text2)
    {
    }

    public static int CompareStrings(string text1, string text2)
    {
    }

    public static bool AreExactlyEqual(string text1, string text2)
    {
    }
}

/*
Answer:

using System;

// Task: String Comparisons
// Compare strings with and without case sensitivity and return normalized ordering.

public class Solution
{
    public static bool AreEqualIgnoreCase(string text1, string text2)
    {
        return string.Equals(text1, text2, StringComparison.OrdinalIgnoreCase);
    }

    public static int CompareStrings(string text1, string text2)
    {
        int comparison = string.Compare(text1, text2, StringComparison.Ordinal);
        return comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
    }

    public static bool AreExactlyEqual(string text1, string text2)
    {
        return text1 == text2;
    }
}
*/
