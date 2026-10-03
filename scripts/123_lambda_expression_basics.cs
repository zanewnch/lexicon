using System;

// Exercise: Lambda Expression Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return lambdas that double, square, and negate an integer.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return lambdas that double, square, and negate an integer.
public class Solution
{
    public static Func<int, int> GetDoubler()
    {
    }

    public static Func<int, int> GetSquarer()
    {
    }

    public static Func<int, int> GetNegator()
    {
    }
}

/*
Answer:

using System;

// Task: Lambda Expression Basics
// Return lambdas that double, square, and negate an integer.

public class Solution
{
    public static Func<int, int> GetDoubler()
    {
        return value => value * 2;
    }

    public static Func<int, int> GetSquarer()
    {
        return value => value * value;
    }

    public static Func<int, int> GetNegator()
    {
        return value => -value;
    }
}
*/
