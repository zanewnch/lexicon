// Exercise: Relational Patterns
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Categorize ages with relational patterns in a switch expression.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Categorize ages with relational patterns in a switch expression.
public class Solution
{
    public static string CategorizeAge(int age)
    {
    }
}

/*
Answer:

// Task: Relational Patterns
// Categorize ages with relational patterns in a switch expression.

public class Solution
{
    public static string CategorizeAge(int age)
    {
        return age switch
        {
            < 0 => "Invalid",
            < 2 => "Infant",
            < 13 => "Child",
            < 20 => "Teenager",
            < 65 => "Adult",
            _ => "Senior"
        };
    }
}
*/
