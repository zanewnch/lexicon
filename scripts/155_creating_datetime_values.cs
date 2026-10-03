using System;
using System.Globalization;

// Exercise: Creating DateTime Values
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create July 4, 1990 at 2:30:00 PM and print it using US culture.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Create July 4, 1990 at 2:30:00 PM and print it using US culture.
public class Solution
{
    public static void PrintBirthday()
    {
    }
}

/*
Answer:

using System;
using System.Globalization;

// Task: Creating DateTime Values
// Create July 4, 1990 at 2:30:00 PM and print it using US culture.

public class Solution
{
    public static void PrintBirthday()
    {
        DateTime birthday = new DateTime(1990, 7, 4, 14, 30, 0);
        Console.WriteLine(birthday.ToString("M/d/yyyy h:mm:ss tt", CultureInfo.GetCultureInfo("en-US")));
    }
}
*/
