using System;

// Exercise: Type Patterns with Variables
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Describe int, string, double, and bool values using type patterns with variables.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Describe int, string, double, and bool values using type patterns with variables.
public class Solution
{
    public static string DescribeValue(object value)
    {
    }
}

/*
Answer:

using System;

// Task: Type Patterns with Variables
// Describe int, string, double, and bool values using type patterns with variables.

public class Solution
{
    public static string DescribeValue(object value)
    {
        return value switch
        {
            int number => $"Integer: {number * 2}",
            string text => $"String: {text.ToUpper()}",
            double number => $"Double: {number:F2}",
            bool flag => $"Boolean: {(flag ? "yes" : "no")}",
            _ => "Unknown type"
        };
    }
}
*/
