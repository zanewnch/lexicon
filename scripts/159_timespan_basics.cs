using System;

// Exercise: TimeSpan Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the positive whole-day difference between two dates.
//
// Methods and APIs to use:
// - Math.Abs
//
// Expected output:
// Return the positive whole-day difference between two dates.
public class Solution
{
    public static int GetDaysBetween(DateTime startDate, DateTime endDate)
    {
    }
}

/*
Answer:

using System;

// Task: TimeSpan Basics
// Return the positive whole-day difference between two dates.

public class Solution
{
    public static int GetDaysBetween(DateTime startDate, DateTime endDate)
    {
        return Math.Abs((endDate - startDate).Days);
    }
}
*/
