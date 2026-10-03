// Exercise: Partial Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Implement partial properties for a person's full name and age, where age
// is calculated as 2024 minus the birth year.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Implement partial properties for a person's full name and age, where age
// is calculated as 2024 minus the birth year.
public class Solution
{
    public static string GetPersonInfo(string firstName, string lastName, int birthYear)
    {
    }
}

/*
Answer:

// Task: Partial Properties
// Implement partial properties for a person's full name and age, where age
// is calculated as 2024 minus the birth year.

public partial class Person
{
    public string FirstName { get; }
    public string LastName { get; }
    public int BirthYear { get; }

    public partial string FullName { get; }
    public partial int Age { get; }

    public Person(string firstName, string lastName, int birthYear)
    {
        FirstName = firstName;
        LastName = lastName;
        BirthYear = birthYear;
    }
}

public partial class Person
{
    public partial string FullName => $"{FirstName} {LastName}";
    public partial int Age => 2024 - BirthYear;
}

public class Solution
{
    public static string GetPersonInfo(string firstName, string lastName, int birthYear)
    {
        Person person = new(firstName, lastName, birthYear);
        return $"{person.FullName} is {person.Age} years old";
    }
}
*/
