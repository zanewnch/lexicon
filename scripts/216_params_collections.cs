using System.Collections.Generic;

// Exercise: Params Collections
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Accept a params List<int> collection and return the sum of its numbers.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Accept a params List<int> collection and return the sum of its numbers.
public class Solution
{
    public static int SumAll(params List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Params Collections
// Accept a variable number of List<int> values and return their total sum.

public class Solution
{
    public static int SumAll(params List<int> numbers)
    {
        return numbers?.SelectMany(numberList => numberList).Sum() ?? 0;
    }
}
*/
