using System;

// Exercise: Understanding Attributes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Mark OldCalculation as obsolete with the specified migration message,
// then call it from GetObsoleteMessage.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Mark OldCalculation as obsolete with the specified migration message,
// then call it from GetObsoleteMessage.
public class Solution
{
    public static string OldCalculation(int x, int y)
    {
    }

    public static string GetObsoleteMessage()
    {
    }
}

/*
Answer:

using System;

// Task: Understanding Attributes
// Mark OldCalculation as obsolete with the specified migration message,
// then call it from GetObsoleteMessage.

public class Solution
{
    [Obsolete("Use NewCalculation instead. This method will be removed in version 2.0.")]
    public static string OldCalculation(int x, int y)
    {
        return $"Result: {x + y}";
    }

    public static string GetObsoleteMessage()
    {
        return OldCalculation(5, 3);
    }
}
*/
