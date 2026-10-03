using System.Globalization;

// Exercise: Format Specifiers
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Format currency, numbers, and ratios with C, N, and P specifiers
// using invariant culture for repeatable output.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Format currency, numbers, and ratios with C, N, and P specifiers
// using invariant culture for repeatable output.
public class Solution
{
    public static string FormatAsCurrency(decimal amount)
    {
    }

    public static string FormatAsNumber(double value)
    {
    }

    public static string FormatAsPercent(double ratio)
    {
    }
}

/*
Answer:

using System.Globalization;

// Task: Format Specifiers
// Format currency, numbers, and ratios with C, N, and P specifiers
// using invariant culture for repeatable output.

public class Solution
{
    public static string FormatAsCurrency(decimal amount)
    {
        return amount.ToString("C", CultureInfo.InvariantCulture);
    }

    public static string FormatAsNumber(double value)
    {
        return value.ToString("N", CultureInfo.InvariantCulture);
    }

    public static string FormatAsPercent(double ratio)
    {
        return ratio.ToString("P", CultureInfo.InvariantCulture);
    }
}
*/
