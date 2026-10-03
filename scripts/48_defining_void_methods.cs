using System;

// Exercise: Defining void methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define a private PrintGreeting method and call it from the public Greet method.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Define a private PrintGreeting method and call it from the public Greet method.
public class Solution
{
    public static void Greet()
    {
    }

    private static void PrintGreeting()
    {
    }
}

/*
Answer:

using System;

// Task: Defining void methods
// Define a private PrintGreeting method and call it from the public Greet method.

public class Solution
{
    public static void Greet()
    {
        PrintGreeting();
    }

    private static void PrintGreeting()
    {
        Console.WriteLine("Hello, World!");
    }
}
*/
