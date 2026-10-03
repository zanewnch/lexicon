using System;

// Exercise: Try-Catch Blocks
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Divide two integers and catch DivideByZeroException with a friendly message.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Divide two integers and catch DivideByZeroException with a friendly message.
public class Solution
{
    public static void SafeDivide(int dividend, int divisor)
    {
    }
}

/*
Answer:

using System;

// Task: Try-Catch Blocks
// Divide two integers and catch DivideByZeroException with a friendly message.

public class Solution
{
    public static void SafeDivide(int dividend, int divisor)
    {
        try
        {
            Console.WriteLine($"Result: {dividend / divisor}");
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine("Error: Cannot divide by zero!");
        }
    }
}
*/
