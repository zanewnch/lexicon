using System;

// Exercise: Multiple Catch Blocks
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Parse two numeric strings, divide them, and handle format and zero-divisor
// failures with separate catch blocks.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Parse two numeric strings, divide them, and handle format and zero-divisor
// failures with separate catch blocks.
public class Solution
{
    public static void ProcessInput(string numberText, string divisorText)
    {
    }
}

/*
Answer:

using System;

// Task: Multiple Catch Blocks
// Parse two numeric strings, divide them, and handle format and zero-divisor
// failures with separate catch blocks.

public class Solution
{
    public static void ProcessInput(string numberText, string divisorText)
    {
        try
        {
            int number = int.Parse(numberText);
            int divisor = int.Parse(divisorText);
            Console.WriteLine($"Result: {number / divisor}");
        }
        catch (FormatException)
        {
            Console.WriteLine("Error: Invalid number format");
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine("Error: Cannot divide by zero");
        }
    }
}
*/
