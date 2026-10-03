using System;
using System.Collections.Generic;

// Exercise: Looping Through Dictionaries
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print each dictionary entry as Key: Value on its own line.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print each dictionary entry as Key: Value on its own line.
public class Solution
{
  public static void PrintDictionary(Dictionary<string, int> dictionary)
  {
    foreach (var (key, value) in dictionary)
    {
      Console.WriteLine($"{key} {value}");
    }
  }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: Looping Through Dictionaries
// Print each dictionary entry as Key: Value on its own line.

public class Solution
{
    public static void PrintDictionary(Dictionary<string, int> dictionary)
    {
        foreach (KeyValuePair<string, int> entry in dictionary)
        {
            Console.WriteLine($"{entry.Key}: {entry.Value}");
        }
    }
}
*/
