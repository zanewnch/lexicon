using System;

// Exercise: The break statement
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Find and print the first number from 1 through 100 divisible by 7,
// then leave the loop immediately with break.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Find and print the first number from 1 through 100 divisible by 7,
// then leave the loop immediately with break.
public class Solution
{
    public static void FindFirstDivisibleBySeven()
    {
    }
}

/*
Answer:

using System;

// Task: The break statement
// Find and print the first number from 1 through 100 divisible by 7,
// then leave the loop immediately with break.

public class Solution
{
    public static void FindFirstDivisibleBySeven()
    {
        for (int number = 1; number <= 100; number++)
        {
            if (number % 7 == 0)
            {
                Console.WriteLine(number);
                break;
            }
        }
    }
}
*/
