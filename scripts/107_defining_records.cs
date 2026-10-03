// Exercise: Defining Records
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define a Person record, create records, format their information,
// and compare records by value.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define a Person record, create records, format their information,
// and compare records by value.
public class Solution
{
    public static Person CreatePerson(string name, int age)
    {
    }

    public static string GetPersonInfo(Person person)
    {
    }

    public static bool ArePeopleEqual(Person person1, Person person2)
    {
    }
}

/*
Answer:

// Task: Defining Records
// Define a Person record, create records, format their information,
// and compare records by value.

public record Person(string Name, int Age);

public class Solution
{
    public static Person CreatePerson(string name, int age)
    {
        return new Person(name, age);
    }

    public static string GetPersonInfo(Person person)
    {
        return $"Name: {person.Name}, Age: {person.Age}";
    }

    public static bool ArePeopleEqual(Person person1, Person person2)
    {
        return person1 == person2;
    }
}
*/
