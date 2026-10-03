using System;

// Exercise: Date Arithmetic
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add days, months, and years to dates, and calculate the days between dates.
//
// Methods and APIs to use:
// - Math.Abs
//
// Expected output:
// Add days, months, and years to dates, and calculate the days between dates.
public class Solution
{
    public static DateTime AddDaysToDate(DateTime date, int days)
    {
    }

    public static DateTime AddMonthsToDate(DateTime date, int months)
    {
    }

    public static DateTime AddYearsToDate(DateTime date, int years)
    {
    }

    public static int GetDaysBetween(DateTime firstDate, DateTime secondDate)
    {
    }
}

/*
Answer:

using System;

// Task: Date Arithmetic
// Add days, months, and years to dates, and calculate the days between dates.

public class Solution
{
    public static DateTime AddDaysToDate(DateTime date, int days)
    {
        return date.AddDays(days);
    }

    public static DateTime AddMonthsToDate(DateTime date, int months)
    {
        return date.AddMonths(months);
    }

    public static DateTime AddYearsToDate(DateTime date, int years)
    {
        return date.AddYears(years);
    }

    public static int GetDaysBetween(DateTime firstDate, DateTime secondDate)
    {
        return Math.Abs((secondDate - firstDate).Days);
    }
}
*/
