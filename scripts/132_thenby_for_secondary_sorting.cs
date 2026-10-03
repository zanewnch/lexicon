using System.Collections.Generic;
using System.Linq;

// Exercise: ThenBy for Secondary Sorting
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Sort full names by last name, then by first name for matching last names.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Sort full names by last name, then by first name for matching last names.
public class Solution
{
    public static List<string> SortByLastNameThenFirstName(List<string> fullNames)
    {
    }

    private static string GetLastName(string fullName)
    {
    }

    private static string GetFirstName(string fullName)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: ThenBy for Secondary Sorting
// Sort full names by last name, then by first name for matching last names.

public class Solution
{
    public static List<string> SortByLastNameThenFirstName(List<string> fullNames)
    {
        return fullNames
            .OrderBy(GetLastName)
            .ThenBy(GetFirstName)
            .ToList();
    }

    private static string GetLastName(string fullName)
    {
        return fullName[(fullName.LastIndexOf(' ') + 1)..];
    }

    private static string GetFirstName(string fullName)
    {
        return fullName[..fullName.IndexOf(' ')];
    }
}
*/
