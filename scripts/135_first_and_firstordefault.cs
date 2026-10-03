using System.Collections.Generic;
using System.Linq;

// Exercise: First and FirstOrDefault
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the first name meeting the minimum length, or a fallback message.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the first name meeting the minimum length, or a fallback message.
public class Solution
{
    public static string GetFirstLongName(List<string> names, int minLength)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: First and FirstOrDefault
// Return the first name meeting the minimum length, or a fallback message.

public class Solution
{
    public static string GetFirstLongName(List<string> names, int minLength)
    {
        return names.FirstOrDefault(name => name.Length >= minLength) ?? "No match found";
    }
}
*/
