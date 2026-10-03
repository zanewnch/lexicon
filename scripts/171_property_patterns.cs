// Exercise: Property Patterns
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Classify a Person by age and employment status using a switch expression.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Classify a Person by age and employment status using a switch expression.
public class Solution
{
    public static string ClassifyPerson(Person person)
    {
    }
}

/*
Answer:

// Task: Property Patterns
// Classify a Person by age and employment status using a switch expression.

public class Person
{
    public Person(string name, int age, bool isEmployed)
    {
        Name = name;
        Age = age;
        IsEmployed = isEmployed;
    }

    public string Name { get; }
    public int Age { get; }
    public bool IsEmployed { get; }
}

public class Solution
{
    public static string ClassifyPerson(Person person)
    {
        return person switch
        {
            { Age: < 18 } => "Minor",
            { Age: >= 65 } => "Senior",
            { Age: >= 18 and < 65, IsEmployed: true } => "Working Adult",
            _ => "Unemployed Adult"
        };
    }
}
*/
