// Exercise: Fields
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Store a person's name and age in public fields, then return formatted info.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Store a person's name and age in public fields, then return formatted info.
public class Solution
{
    public static string GetPersonInfo(string name, int age)
    {
    }
}

/*
Answer:

// Task: Fields
// Store a person's name and age in public fields, then return formatted info.

public class Person
{
    public string Name = string.Empty;
    public int Age;
}

public class Solution
{
    public static string GetPersonInfo(string name, int age)
    {
        Person person = new Person
        {
            Name = name,
            Age = age
        };

        return $"Name: {person.Name}, Age: {person.Age}";
    }
}
*/
