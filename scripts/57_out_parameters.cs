// Exercise: out Parameters
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Perform integer division through out parameters. Return false and zero both
// outputs when the divisor is zero.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Perform integer division through out parameters. Return false and zero both
// outputs when the divisor is zero.
public class Solution
{
    public static bool Divide(int dividend, int divisor, out int quotient, out int remainder)
    {
    }
}

/*
Answer:

// Task: out Parameters
// Perform integer division through out parameters. Return false and zero both
// outputs when the divisor is zero.

public class Solution
{
    public static bool Divide(int dividend, int divisor, out int quotient, out int remainder)
    {
        if (divisor == 0)
        {
            quotient = 0;
            remainder = 0;
            return false;
        }

        quotient = dividend / divisor;
        remainder = dividend % divisor;
        return true;
    }
}
*/
