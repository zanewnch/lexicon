// Exercise: Init-Only Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a Person with Name, Age, and City init-only properties.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a Person with Name, Age, and City init-only properties.
public class Solution
{
    public static string CreateAndDescribePerson(string name, int age, string city)
    {
    }
}

/*
Answer:

// Task: Init-Only Properties
// Create a Person with Name, Age, and City init-only properties.

public class Person
{
    public string Name { get; init; } = string.Empty;
    public int Age { get; init; }
    public string City { get; init; } = string.Empty;
}

public class Solution
{
    public static string CreateAndDescribePerson(string name, int age, string city)
    {
        Person person = new Person
        {
            Name = name,
            Age = age,
            City = city
        };

        return $"Name: {person.Name}, Age: {person.Age}, City: {person.City}";
    }
}
*/
