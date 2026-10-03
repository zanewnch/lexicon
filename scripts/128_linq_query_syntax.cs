using System.Collections.Generic;
using System.Linq;

// Exercise: LINQ Query Syntax
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Filter even numbers and double them using LINQ query syntax.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Filter even numbers and double them using LINQ query syntax.
public class Solution
{
    public static List<int> GetEvenNumbersDoubled(List<int> numbers)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: LINQ Query Syntax
// Filter even numbers and double them using LINQ query syntax.

public class Solution
{
    public static List<int> GetEvenNumbersDoubled(List<int> numbers)
    {
        var query = from number in numbers
                    where number % 2 == 0
                    select number * 2;

        return query.ToList();
    }
}
*/
