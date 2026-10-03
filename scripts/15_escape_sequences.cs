using System;

// Exercise: Escape Sequences
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print four lines: a quoted welcome message, an empty line, a Windows path,
// and a line that starts with a tab character.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print four lines: a quoted welcome message, an empty line, a Windows path,
// and a line that starts with a tab character.
public class Solution
{
  public static void PrintFormattedMessage()
  {
    Console.WriteLine("Welcome");
    Console.WriteLine();
    Console.WriteLine(@"Path: C:\\Users\\Documents");
    Console.WriteLine("\tIndented with a tab");
  }
}

/*
Answer:

using System;

// Task: Escape Sequences
// Print four lines: a quoted welcome message, an empty line, a Windows path,
// and a line that starts with a tab character.

public class Solution
{
    public static void PrintFormattedMessage()
    {
        Console.WriteLine("\"Welcome to C#!\"");
        Console.WriteLine();
        Console.WriteLine("Path: C:\\Users\\Documents");
        Console.WriteLine("\tIndented with a tab");
    }
}
*/
