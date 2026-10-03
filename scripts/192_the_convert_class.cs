using System;

// Exercise: The Convert Class
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Convert the provided values, add the two integers, and return the result
// together with the converted boolean string in the format "sum:boolString".
//
// Methods and APIs to use:
// - Convert.ToInt32
// - Convert.ToString
//
// Expected output:
// Convert the provided values, add the two integers, and return the result
// together with the converted boolean string in the format "sum:boolString".
public class Solution
{
    public static string ConvertValues(string numberString, double decimalValue, bool boolValue)
    {
    }
}

/*
Answer:

using System;

// Task: The Convert Class
// Convert the provided values, add the two integers, and return the result
// together with the converted boolean string in the format "sum:boolString".

public class Solution
{
    public static string ConvertValues(string numberString, double decimalValue, bool boolValue)
    {
        int number = Convert.ToInt32(numberString);
        int decimalNumber = Convert.ToInt32(decimalValue);
        string booleanText = Convert.ToString(boolValue);

        return $"{number + decimalNumber}:{booleanText}";
    }
}
*/
