// Exercise: Switch with Type Patterns
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Handle int, double, string, bool, null, and unknown object values by type.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Handle int, double, string, bool, null, and unknown object values by type.
public class Solution
{
    public static string HandleObject(object value)
    {
    }
}

/*
Answer:

// Task: Switch with Type Patterns
// Handle int, double, string, bool, null, and unknown object values by type.

public class Solution
{
    public static string HandleObject(object value)
    {
        return value switch
        {
            null => "Null value",
            int number => $"Integer: {number}",
            double number => $"Double: {number:F2}",
            string text => $"String: {text.ToUpper()}",
            bool flag => $"Boolean: {flag}",
            _ => "Unknown type"
        };
    }
}
*/
