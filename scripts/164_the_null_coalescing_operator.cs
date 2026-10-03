// Exercise: The Null-Coalescing Operator
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the nullable number, or defaultValue when the number is null.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the nullable number, or defaultValue when the number is null.
public class Solution
{
    public static int GetValueOrDefault(int? number, int defaultValue)
    {
    }
}

/*
Answer:

// Task: The Null-Coalescing Operator
// Return the nullable number, or defaultValue when the number is null.

public class Solution
{
    public static int GetValueOrDefault(int? number, int defaultValue)
    {
        return number ?? defaultValue;
    }
}
*/
