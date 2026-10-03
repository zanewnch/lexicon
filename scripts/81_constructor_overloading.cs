// Exercise: Constructor Overloading
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Provide constructors for a Person with either a name or a name and age.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Provide constructors for a Person with either a name or a name and age.
public class Solution
{
    public static string CreatePerson(string name)
    {
    }

    public static string CreatePersonWithAge(string name, int age)
    {
    }
}

/*
Answer:

// Task: Constructor Overloading
// Provide constructors for a Person with either a name or a name and age.

public class Person
{
    public string Name;
    public int Age;

    public Person(string name)
    {
        Name = name;
        Age = 0;
    }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}

public class Solution
{
    public static string CreatePerson(string name)
    {
        Person person = new Person(name);
        return $"{person.Name} is {person.Age} years old";
    }

    public static string CreatePersonWithAge(string name, int age)
    {
        Person person = new Person(name, age);
        return $"{person.Name} is {person.Age} years old";
    }
}
*/
