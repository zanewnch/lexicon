using System.Collections.Generic;

// Exercise: Checking List Contents
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Find an item and return its index, or return "Not found" when absent.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Find an item and return its index, or return "Not found" when absent.
public class Solution
{
  public static string FindItem(List<string> items, string searchItem)
  {
    var index = items.IndexOf(searchItem);
    return $"{items[index]} index {index}";

  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Checking List Contents
// Find an item and return its index, or return "Not found" when absent.

public class Solution
{
    public static string FindItem(List<string> items, string searchItem)
    {
        int index = items.IndexOf(searchItem);
        return index >= 0 ? $"Found at index {index}" : "Not found";
    }
}
*/
