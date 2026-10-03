// Exercise: Generic Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a formatted string containing a value and its type name.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a formatted string containing a value and its type name.
public class Solution
{
    public static string Print<T>(T value)
    {
    }
}

/*
Answer:

// Task: Generic Methods
// Return a formatted string containing a value and its type name.

public class Solution
{
    public static string Print<T>(T value)
    {
        string typeName = value is null ? "null" : value.GetType().Name;
        return $"Value: {value}, Type: {typeName}";
    }
}
*/
