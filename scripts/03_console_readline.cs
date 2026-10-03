using System;

// Exercise: Console.ReadLine
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Read the user's name with Console.ReadLine(), store it in a string,
// and print the name with Console.WriteLine().
//
// Methods and APIs to use:
// - Console.ReadLine
// - Console.WriteLine
//
// Expected output:
// Read the user's name with Console.ReadLine(), store it in a string,
// and print the name with Console.WriteLine().
public class Solution
{
    public static void GreetUser()
    {
        string result = Console.ReadLine() ?? string.Empty;
        Console.WriteLine(result);

        // string? result = Console.ReadLine();
    }
}

/*
Answer:

using System;

// Task: Console.ReadLine
// Read the user's name with Console.ReadLine(), store it in a string,
// and print the name with Console.WriteLine().

public class Solution
{
    public static void GreetUser()
    {
        string name = Console.ReadLine() ?? string.Empty;

        Console.WriteLine(name);
    }
}
*/
