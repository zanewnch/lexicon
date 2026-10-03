using System;

// Exercise: Lambda with Multiple Statements
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use a statement lambda to take the absolute value, double it, and add 10.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use a statement lambda to take the absolute value, double it, and add 10.
public class Solution
{
    public static int RunComplexProcessing(int number)
    {
    }
}

/*
Answer:

using System;

// Task: Lambda with Multiple Statements
// Use a statement lambda to take the absolute value, double it, and add 10.

public class Solution
{
    public static int RunComplexProcessing(int number)
    {
        Func<int, int> process = value =>
        {
            if (value < 0)
            {
                value = -value;
            }

            value *= 2;
            value += 10;
            return value;
        };

        return process(number);
    }
}
*/
