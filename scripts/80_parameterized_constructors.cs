// Exercise: Parameterized Constructors
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Construct a Person from a name and age, then return formatted information.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Construct a Person from a name and age, then return formatted information.
public class Solution
{
    public static string CreatePersonInfo(string name, int age)
    {
    }
}

/*
Answer:

// Task: Parameterized Constructors
// Construct a Person from a name and age, then return formatted information.

public class Person
{
    public string Name;
    public int Age;

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}

public class Solution
{
    public static string CreatePersonInfo(string name, int age)
    {
        Person person = new Person(name, age);
        return $"Name: {person.Name}, Age: {person.Age}";
    }
}
*/
