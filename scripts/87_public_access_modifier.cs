// Exercise: Public Access Modifier
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a Person with public Name and Age fields and a public Greet method.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a Person with public Name and Age fields and a public Greet method.
public class Solution
{
    public static string GetPersonInfo(string name, int age)
    {
    }
}

/*
Answer:

// Task: Public Access Modifier
// Create a Person with public Name and Age fields and a public Greet method.

public class Person
{
    public string Name = string.Empty;
    public int Age;

    public string Greet()
    {
        return $"Hello, I'm {Name} and I'm {Age} years old.";
    }
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

        return person.Greet();
    }
}
*/
