using System.Collections.Generic;
using System.Linq;

// Exercise: OrderBy for Sorting
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the supplied names in alphabetical order.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the supplied names in alphabetical order.
public class Solution
{
    public static List<string> SortNamesAlphabetically(List<string> names)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: OrderBy for Sorting
// Return the supplied names in alphabetical order.

public class Solution
{
    public static List<string> SortNamesAlphabetically(List<string> names)
    {
        return names.OrderBy(name => name).ToList();
    }
}
*/
