using System;

// Exercise: Looping Arrays with foreach
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use foreach to print every name in the supplied array on its own line.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Use foreach to print every name in the supplied array on its own line.
public class Solution
{
  public static void PrintNames(string[] names)
  {
    foreach (var item in names)
    {
      Console.WriteLine(item);
    }
  }
}

/*
Answer:

using System;

// Task: Looping Arrays with foreach
// Use foreach to print every name in the supplied array on its own line.

public class Solution
{
    public static void PrintNames(string[] names)
    {
        foreach (string name in names)
        {
            Console.WriteLine(name);
        }
    }
}
*/
