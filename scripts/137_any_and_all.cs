using System.Collections.Generic;
using System.Linq;

// Exercise: Any and All
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Check whether any number is negative and whether every number is positive.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Check whether any number is negative and whether every number is positive.
public class Solution
{
    public static bool HasAnyNegative(List<int> numbers)
    {
    }

    public static bool AreAllPositive(List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Any and All
// Check whether any number is negative and whether every number is positive.

public class Solution
{
    public static bool HasAnyNegative(List<int> numbers)
    {
        return numbers.Any(number => number < 0);
    }

    public static bool AreAllPositive(List<int> numbers)
    {
        return numbers.All(number => number > 0);
    }
}
*/
