// Exercise: Named Tuple Elements
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a named person tuple and use its elements in a description.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a named person tuple and use its elements in a description.
public class Solution
{
    public static string GetPersonDescription(string name, int age, string city)
    {
    }
}

/*
Answer:

// Task: Named Tuple Elements
// Create a named person tuple and use its elements in a description.

public class Solution
{
    public static (string Name, int Age, string City) CreateNamedPersonTuple(
        string name, int age, string city)
    {
        return (name, age, city);
    }

    public static string GetPersonDescription(string name, int age, string city)
    {
        (string Name, int Age, string City) person = CreateNamedPersonTuple(name, age, city);
        return $"{person.Name} is {person.Age} years old and lives in {person.City}";
    }
}
*/
