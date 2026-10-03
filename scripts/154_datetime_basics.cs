using System;

// Exercise: DateTime Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print today's date as Year-Month-Day and the current time as Hour:Minute:Second.
//
// Methods and APIs to use:
// - DateTime.Today
// - DateTime.Now
// - Console.WriteLine
//
// Expected output:
// Print today's date as Year-Month-Day and the current time as Hour:Minute:Second.
public class Solution
{
    public static void PrintDateAndTime()
    {
    }
}

/*
Answer:

using System;

// Task: DateTime Basics
// Print today's date as Year-Month-Day and the current time as Hour:Minute:Second.

public class Solution
{
    public static void PrintDateAndTime()
    {
        DateTime today = DateTime.Today;
        DateTime now = DateTime.Now;

        Console.WriteLine($"{today.Year}-{today.Month}-{today.Day}");
        Console.WriteLine($"{now.Hour}:{now.Minute:D2}:{now.Second:D2}");
    }
}
*/
