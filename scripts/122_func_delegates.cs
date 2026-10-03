using System;

// Exercise: Func Delegates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Apply the supplied two-argument Func operation to a and b.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Apply the supplied two-argument Func operation to a and b.
public class Solution
{
    public static int Calculate(int a, int b, Func<int, int, int> operation)
    {
    }
}

/*
Answer:

using System;

// Task: Func Delegates
// Apply the supplied two-argument Func operation to a and b.

public class Solution
{
    public static int Calculate(int a, int b, Func<int, int, int> operation)
    {
        return operation(a, b);
    }
}
*/
