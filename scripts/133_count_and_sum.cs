using System.Collections.Generic;
using System.Linq;

// Exercise: Count and Sum
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Count positive values and sum even values with LINQ.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Count positive values and sum even values with LINQ.
public class Solution
{
    public static int CountPositiveNumbers(List<int> numbers)
    {
    }

    public static int SumEvenNumbers(List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Count and Sum
// Count positive values and sum even values with LINQ.

public class Solution
{
    public static int CountPositiveNumbers(List<int> numbers)
    {
        return numbers.Count(number => number > 0);
    }

    public static int SumEvenNumbers(List<int> numbers)
    {
        return numbers.Where(number => number % 2 == 0).Sum();
    }
}
*/
