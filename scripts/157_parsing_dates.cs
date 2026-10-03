using System;
using System.Globalization;

// Exercise: Parsing Dates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Validate, parse, and format date strings; return Invalid when parsing fails.
//
// Methods and APIs to use:
// - DateTime.TryParse
// - DateTime.Parse
//
// Expected output:
// Validate, parse, and format date strings; return Invalid when parsing fails.
public class Solution
{
    public static bool IsValidDate(string dateString)
    {
    }

    public static DateTime ParseDate(string dateString)
    {
    }

    public static string ParseAndFormat(string dateString, string format)
    {
    }
}

/*
Answer:

using System;
using System.Globalization;

// Task: Parsing Dates
// Validate, parse, and format date strings; return Invalid when parsing fails.

public class Solution
{
    public static bool IsValidDate(string dateString)
    {
        return DateTime.TryParse(dateString, out _);
    }

    public static DateTime ParseDate(string dateString)
    {
        return DateTime.Parse(dateString);
    }

    public static string ParseAndFormat(string dateString, string format)
    {
        return DateTime.TryParse(dateString, out DateTime date)
            ? date.ToString(format, CultureInfo.InvariantCulture)
            : "Invalid";
    }
}
*/
