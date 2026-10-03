// Exercise: Read-Only Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a Person whose Name and BirthYear can only be assigned by its constructor.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a Person whose Name and BirthYear can only be assigned by its constructor.
public class Solution
{
    public static string GetPersonInfo(string name, int birthYear)
    {
    }
}

/*
Answer:

// Task: Read-Only Properties
// Create a Person whose Name and BirthYear can only be assigned by its constructor.

public class Person
{
    public Person(string name, int birthYear)
    {
        Name = name;
        BirthYear = birthYear;
    }

    public string Name { get; }
    public int BirthYear { get; }
}

public class Solution
{
    public static string GetPersonInfo(string name, int birthYear)
    {
        Person person = new Person(name, birthYear);
        return $"{person.Name} was born in {person.BirthYear}";
    }
}
*/
