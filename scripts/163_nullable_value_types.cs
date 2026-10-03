// Exercise: Nullable Value Types
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Describe whether a nullable integer has a value and include that value when present.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Describe whether a nullable integer has a value and include that value when present.
public class Solution
{
    public static string CheckNullableValue(int? number)
    {
    }
}

/*
Answer:

// Task: Nullable Value Types
// Describe whether a nullable integer has a value and include that value when present.

public class Solution
{
    public static string CheckNullableValue(int? number)
    {
        return number.HasValue ? $"Has value: {number.Value}" : "No value";
    }
}
*/
