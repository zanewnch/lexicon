using System;
using System.Globalization;

// Exercise: Formatting Dates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Format a DateTime as ISO, long-date, and custom day/month/year strings.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Format a DateTime as ISO, long-date, and custom day/month/year strings.
public class Solution
{
    public static string FormatAsIso(DateTime date)
    {
    }

    public static string FormatAsLongDate(DateTime date)
    {
    }

    public static string FormatAsCustom(DateTime date)
    {
    }
}

/*
Answer:

using System;
using System.Globalization;

// Task: Formatting Dates
// Format a DateTime as ISO, long-date, and custom day/month/year strings.

public class Solution
{
    public static string FormatAsIso(DateTime date)
    {
        return date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    public static string FormatAsLongDate(DateTime date)
    {
        return date.ToString("MMMM dd, yyyy", CultureInfo.InvariantCulture);
    }

    public static string FormatAsCustom(DateTime date)
    {
        return date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
    }
}
*/
