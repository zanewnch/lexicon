using System;

// Exercise: Throwing Exceptions
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Throw ArgumentException for negative inputs; otherwise return the integer
// part of the square root.
//
// Methods and APIs to use:
// - Math.Sqrt
//
// Expected output:
// Throw ArgumentException for negative inputs; otherwise return the integer
// part of the square root.
public class Solution
{
    public static int CalculateSquareRoot(int number)
    {
    }
}

/*
Answer:

using System;

// Task: Throwing Exceptions
// Throw ArgumentException for negative inputs; otherwise return the integer
// part of the square root.

public class Solution
{
    public static int CalculateSquareRoot(int number)
    {
        if (number < 0)
        {
            throw new ArgumentException("Number cannot be negative");
        }

        return (int)Math.Sqrt(number);
    }
}
*/
