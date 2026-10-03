using System;
using System.Collections.Generic;

// Exercise: Accessing List Elements
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print the first and last item in the supplied string list.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print the first and last item in the supplied string list.
public class Solution
{
  public static void PrintFirstAndLast(List<string> items)
  {
    var first = items[0];
    var last = items[^1];
    Console.WriteLine(first + last);
  }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: Accessing List Elements
// Print the first and last item in the supplied string list.

public class Solution
{
    public static void PrintFirstAndLast(List<string> items)
    {
        Console.WriteLine(items[0]);
        Console.WriteLine(items[^1]);
    }
}
*/
