using System;

// Exercise: DateOnly Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a DateOnly from year, month, and day, then return its weekday name.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a DateOnly from year, month, and day, then return its weekday name.
public class Solution
{
    public static string GetDayOfWeek(int year, int month, int day)
    {
    }
}

/*
Answer:

using System;

// Task: DateOnly Basics
// Create a DateOnly from year, month, and day, then return its weekday name.

public class Solution
{
    public static string GetDayOfWeek(int year, int month, int day)
    {
        DateOnly date = new DateOnly(year, month, day);
        return date.DayOfWeek.ToString();
    }
}
*/
