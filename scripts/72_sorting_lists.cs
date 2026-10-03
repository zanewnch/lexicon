using System.Collections.Generic;

// Exercise: Sorting Lists
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the supplied integer list sorted in ascending order.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the supplied integer list sorted in ascending order.
public class Solution
{
  public static List<int> SortAscending(List<int> numbers)
  {
    numbers.Sort();
    return numbers;
  }
}

/*
Answer:

using System.Collections.Generic;

// Task: Sorting Lists
// Return the supplied integer list sorted in ascending order.

public class Solution
{
    public static List<int> SortAscending(List<int> numbers)
    {
        numbers.Sort();
        return numbers;
    }
}
*/
