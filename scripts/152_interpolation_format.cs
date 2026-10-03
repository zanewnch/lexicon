using System.Globalization;

// Exercise: Interpolation Format
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use interpolated strings with currency, percent, and number format specifiers.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use interpolated strings with currency, percent, and number format specifiers.
public class Solution
{
    public static string FormatAsCurrency(decimal amount)
    {
    }

    public static string FormatAsPercent(double ratio)
    {
    }

    public static string FormatAsNumber(int value)
    {
    }
}

/*
Answer:

using System.Globalization;

// Task: Interpolation Format
// Use interpolated strings with currency, percent, and number format specifiers.

public class Solution
{
    private static readonly CultureInfo UsCulture = CultureInfo.GetCultureInfo("en-US");

    public static string FormatAsCurrency(decimal amount)
    {
        return $"{amount:C}";
    }

    public static string FormatAsPercent(double ratio)
    {
        return $"{ratio:P}";
    }

    public static string FormatAsNumber(int value)
    {
        return $"{value:N0}";
    }
}
*/
