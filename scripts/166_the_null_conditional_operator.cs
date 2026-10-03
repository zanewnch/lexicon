// Exercise: The Null-Conditional Operator
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a person's name length, or zero when the person or name is null.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a person's name length, or zero when the person or name is null.
public class Solution
{
    public static int GetNameLength(Person? person)
    {
    }
}

/*
Answer:

// Task: The Null-Conditional Operator
// Return a person's name length, or zero when the person or name is null.

public class Person
{
    public string? Name { get; set; }
}

public class Solution
{
    public static int GetNameLength(Person? person)
    {
        return person?.Name?.Length ?? 0;
    }
}
*/
