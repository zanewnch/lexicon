// Exercise: The base Keyword
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use base(name) in Employee's constructor and base.GetInfo() in its override.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use base(name) in Employee's constructor and base.GetInfo() in its override.
public class Solution
{
    public static string CreateEmployee(string name, string department)
    {
    }
}

/*
Answer:

// Task: The base Keyword
// Use base(name) in Employee's constructor and base.GetInfo() in its override.

public class Person
{
    public Person(string name)
    {
        Name = name;
    }

    public string Name { get; }

    public virtual string GetInfo()
    {
        return $"Name: {Name}";
    }
}

public class Employee : Person
{
    public Employee(string name, string department) : base(name)
    {
        Department = department;
    }

    public string Department { get; }

    public override string GetInfo()
    {
        return $"{base.GetInfo()}, Department: {Department}";
    }
}

public class Solution
{
    public static string CreateEmployee(string name, string department)
    {
        return new Employee(name, department).GetInfo();
    }
}
*/
