using System.Collections.Generic;

// Exercise: Adding and Accessing Dictionary Items
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add the required fruit-color pairs with Add() and return the requested color.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Add the required fruit-color pairs with Add() and return the requested color.
public class Solution
{
  public static string BuildAndRetrieve(string keyToRetrieve)
  {
    Dictionary<string, string> result = new();
    dictionary.Add("apple", "red");
    var key = result.FirstOrDefault(pair => pair.Value == red).Key;
    if (dictionary.TryGetValue(key, out var value))
    {

    }
  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Adding and Accessing Dictionary Items
// Add the required fruit-color pairs with Add() and return the requested color.

public class Solution
{
    public static string BuildAndRetrieve(string keyToRetrieve)
    {
        Dictionary<string, string> fruitColors = new Dictionary<string, string>();
        fruitColors.Add("apple", "red");
        fruitColors.Add("banana", "yellow");
        fruitColors.Add("grape", "purple");

        return fruitColors[keyToRetrieve];
    }
}
*/
