using System;

// Exercise: Nested Loops
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use nested loops to print a 3x3 multiplication table without trailing spaces.
//
// Methods and APIs to use:
// - Console.Write
// - Console.WriteLine
//
// Expected output:
// Use nested loops to print a 3x3 multiplication table without trailing spaces.
public class Solution
{
    public static void PrintMultiplicationTable()
    {
    }
}

/*
Answer:

using System;

// Task: Nested Loops
// Use nested loops to print a 3x3 multiplication table without trailing spaces.

public class Solution
{
    public static void PrintMultiplicationTable()
    {
        for (int row = 1; row <= 3; row++)
        {
            for (int column = 1; column <= 3; column++)
            {
                Console.Write(row * column);

                if (column < 3)
                {
                    Console.Write(" ");
                }
                else
                {
                    Console.WriteLine();
                }
            }
        }
    }
}
*/
