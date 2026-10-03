using System;

// Exercise: TryParse Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Safely parse the input string and return the provided default value when
// the input is null, empty, invalid, or otherwise cannot be parsed.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Safely parse the input string and return the provided default value when
// the input is null, empty, invalid, or otherwise cannot be parsed.
public class Solution
{
    public static int SafeParseToInt(string input, int defaultValue)
    {
    }
}

/*
Answer:

using System;

// Task: TryParse Methods
// Safely parse the input string and return the provided default value when
// the input is null, empty, invalid, or otherwise cannot be parsed.

public class Solution
{
    public static int SafeParseToInt(string input, int defaultValue)
    {
        return int.TryParse(input, out int parsedValue) ? parsedValue : defaultValue;
    }
}
*/
