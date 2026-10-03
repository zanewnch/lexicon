using System;

// Exercise: The Finally Block
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Parse and double an integer, print Invalid input on failure,
// and always print Done from a finally block.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Parse and double an integer, print Invalid input on failure,
// and always print Done from a finally block.
public class Solution
{
    public static void ProcessNumber(string input)
    {
    }
}

/*
Answer:

using System;

// Task: The Finally Block
// Parse and double an integer, print Invalid input on failure,
// and always print Done from a finally block.

public class Solution
{
    public static void ProcessNumber(string input)
    {
        try
        {
            int number = int.Parse(input);
            Console.WriteLine(number * 2);
        }
        catch (FormatException)
        {
            Console.WriteLine("Invalid input");
        }
        finally
        {
            Console.WriteLine("Done");
        }
    }
}
*/
