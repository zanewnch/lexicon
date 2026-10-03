using System;

// Exercise: The continue statement
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print numbers 1 through 10, skipping multiples of 3 with continue.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print numbers 1 through 10, skipping multiples of 3 with continue.
public class Solution
{
    public static void PrintSkippingMultiplesOfThree()
    {
    }
}

/*
Answer:

using System;

// Task: The continue statement
// Print numbers 1 through 10, skipping multiples of 3 with continue.

public class Solution
{
    public static void PrintSkippingMultiplesOfThree()
    {
        for (int number = 1; number <= 10; number++)
        {
            if (number % 3 == 0)
            {
                continue;
            }

            Console.WriteLine(number);
        }
    }
}
*/
