// Exercise: The this Keyword
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use this to assign constructor parameters to the corresponding private fields.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use this to assign constructor parameters to the corresponding private fields.
public class Solution
{
    public static string CreateAndDescribePerson(string name, int age)
    {
    }
}

/*
Answer:

// Task: The this Keyword
// Use this to assign constructor parameters to the corresponding private fields.

public class Person
{
    private readonly string _name;
    private readonly int _age;

    public Person(string name, int age)
    {
        this._name = name;
        this._age = age;
    }

    public string Describe()
    {
        return $"{_name} is {_age} years old";
    }
}

public class Solution
{
    public static string CreateAndDescribePerson(string name, int age)
    {
        Person person = new Person(name, age);
        return person.Describe();
    }
}
*/
