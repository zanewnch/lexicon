using System.Collections.Generic;
using System.Linq;

// Exercise: Where for Filtering
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return only the even numbers from the supplied list with Where().
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return only the even numbers from the supplied list with Where().
public class Solution
{
    public static List<int> GetEvenNumbers(List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Where for Filtering
// Return only the even numbers from the supplied list with Where().

public class Solution
{
    public static List<int> GetEvenNumbers(List<int> numbers)
    {
        return numbers.Where(number => number % 2 == 0).ToList();
    }
}
*/
