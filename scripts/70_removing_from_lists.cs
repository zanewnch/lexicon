using System.Collections.Generic;

// Exercise: Removing from Lists
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Remove the requested item by value and return the modified list.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Remove the requested item by value and return the modified list.
public class Solution
{
  public static List<string> RemoveItem(List<string> items, string itemToRemove)
  {
    items.Remove(itemToRemove);
    return items;
  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Removing from Lists
// Remove the requested item by value and return the modified list.

public class Solution
{
    public static List<string> RemoveItem(List<string> items, string itemToRemove)
    {
        items.Remove(itemToRemove);
        return items;
    }
}
*/
