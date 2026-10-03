using System;

// Exercise: Checked Arithmetic
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Multiply two integers inside a checked block, returning "overflow" when
// the multiplication causes an OverflowException.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Multiply two integers inside a checked block, returning "overflow" when
// the multiplication causes an OverflowException.
public class Solution
{
    public static string SafeMultiply(int a, int b)
    {
    }
}

/*
Answer:

using System;

// Task: Checked Arithmetic
// Multiply two integers inside a checked block, returning "overflow" when
// the multiplication causes an OverflowException.

public class Solution
{
    public static string SafeMultiply(int a, int b)
    {
        try
        {
            checked
            {
                return (a * b).ToString();
            }
        }
        catch (OverflowException)
        {
            return "overflow";
        }
    }
}
*/
