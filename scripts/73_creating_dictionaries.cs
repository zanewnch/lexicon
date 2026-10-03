using System.Collections.Generic;

// Exercise: Creating Dictionaries
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a dictionary containing the three specified names and ages.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a dictionary containing the three specified names and ages.
public class Solution
{
  public static Dictionary<string, int> CreateAgeDictionary()
  {
    Dictionary<string, int> result = new();
    result.Add("a", 1);
    result.Add("b", 2);
    result.Add("c", 3);
    return result;

  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Creating Dictionaries
// Create a dictionary containing the three specified names and ages.

public class Solution
{
    public static Dictionary<string, int> CreateAgeDictionary()
    {
        return new Dictionary<string, int>
        {
            ["Alice"] = 25,
            ["Bob"] = 30,
            ["Charlie"] = 35
        };
    }
}
*/
