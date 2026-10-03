// Exercise: Nullable Reference Types
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Describe a nullable string and a regular string, displaying null explicitly.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Describe a nullable string and a regular string, displaying null explicitly.
public class Solution
{
    public static string DescribeStrings(string? nullableText, string regularText)
    {
    }
}

/*
Answer:

// Task: Nullable Reference Types
// Describe a nullable string and a regular string, displaying null explicitly.

public class Solution
{
    public static string DescribeStrings(string? nullableText, string regularText)
    {
        return $"Nullable: {nullableText ?? "null"}, Regular: {regularText}";
    }
}
*/
