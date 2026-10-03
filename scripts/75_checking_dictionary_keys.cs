using System.Collections.Generic;

// Exercise: Checking Dictionary Keys
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Safely look up an inventory item and return the requested status message.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Safely look up an inventory item and return the requested status message.
public class Solution
{
  public static string GetValueSafely(Dictionary<string, int> inventory, string item)
  {
    if (inventory.TryGetValue(item, out var result))
    {
      return result;
    }
  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Checking Dictionary Keys
// Safely look up an inventory item and return the requested status message.

public class Solution
{
    public static string GetValueSafely(Dictionary<string, int> inventory, string item)
    {
        if (inventory.TryGetValue(item, out int quantity))
        {
            return $"{item}: {quantity} in stock";
        }

        return $"{item}: not found";
    }
}
*/
