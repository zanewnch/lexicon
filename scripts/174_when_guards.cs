// Exercise: When Guards
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Classify integers, doubles, strings, null, and unknown values with when guards.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Classify integers, doubles, strings, null, and unknown values with when guards.
public class Solution
{
    public static string ClassifyNumber(object value)
    {
    }
}

/*
Answer:

// Task: When Guards
// Classify integers, doubles, strings, null, and unknown values with when guards.

public class Solution
{
    public static string ClassifyNumber(object value)
    {
        return value switch
        {
            null => "Null value",
            int number when number < 0 => "Negative integer",
            int 0 => "Zero",
            int number when number <= 10 => "Small positive integer",
            int => "Large positive integer",
            double number when number < 0 => "Negative decimal",
            double => "Non-negative decimal",
            string text when string.IsNullOrEmpty(text) => "Empty string",
            string => "Non-empty string",
            _ => "Unknown type"
        };
    }
}
*/
