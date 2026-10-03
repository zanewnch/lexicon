// Exercise: Generic Constraints
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a new T instance using a parameterless-constructor constraint.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a new T instance using a parameterless-constructor constraint.
public class Solution
{
    public static T CreateInstance<T>() where T : new()
    {
    }
}

/*
Answer:

// Task: Generic Constraints
// Create a new T instance using a parameterless-constructor constraint.

public class Person
{
    public string Name { get; set; } = "Unknown";
    public int Age { get; set; }
}

public class Product
{
    public string Title { get; set; } = "Untitled";
    public decimal Price { get; set; }
}

public class Counter
{
    public int Count { get; set; }
}

public class Solution
{
    public static T CreateInstance<T>() where T : new()
    {
        return new T();
    }
}
*/
