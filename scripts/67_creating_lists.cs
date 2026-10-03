using System;
using System.Collections.Generic;

// Exercise: Creating Lists
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a list containing Alice, Bob, and Charlie, then print each name.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Create a list containing Alice, Bob, and Charlie, then print each name.
public class Solution
{
  public static void PrintNames()
  {
    List<string> result = ["Alice", "Bob", "Charlie"];
    Console.WriteLine(result);
  }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: Creating Lists
// Create a list containing Alice, Bob, and Charlie, then print each name.

public class Solution
{
    public static void PrintNames()
    {
        List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

        foreach (string name in names)
        {
            Console.WriteLine(name);
        }
    }
}
*/
