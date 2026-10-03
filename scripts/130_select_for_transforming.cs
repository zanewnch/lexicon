using System.Collections.Generic;
using System.Linq;

// Exercise: Select for Transforming
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a new list containing the square of every supplied number.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a new list containing the square of every supplied number.
public class Solution
{
    public static List<int> GetSquares(List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Select for Transforming
// Return a new list containing the square of every supplied number.

public class Solution
{
    public static List<int> GetSquares(List<int> numbers)
    {
        return numbers.Select(number => number * number).ToList();
    }
}
*/
