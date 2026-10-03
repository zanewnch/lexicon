using System;

// Exercise: Exception Messages
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Parse an integer and print either the parsed value or the FormatException message.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Parse an integer and print either the parsed value or the FormatException message.
public class Solution
{
    public static void PrintExceptionMessage(string input)
    {
    }
}

/*
Answer:

using System;

// Task: Exception Messages
// Parse an integer and print either the parsed value or the FormatException message.

public class Solution
{
    public static void PrintExceptionMessage(string input)
    {
        try
        {
            int number = int.Parse(input);
            Console.WriteLine($"Parsed: {number}");
        }
        catch (FormatException exception)
        {
            Console.WriteLine(exception.Message);
        }
    }
}
*/
