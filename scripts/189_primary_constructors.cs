// Exercise: Primary Constructors
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define Employee with a primary constructor and read-only properties.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define Employee with a primary constructor and read-only properties.
public class Solution
{
    public static string DescribeEmployee(string name, string department, int yearsOfService)
    {
    }
}

/*
Answer:

// Task: Primary Constructors
// Define Employee with a primary constructor and read-only properties.

public class Employee(string name, string department, int yearsOfService)
{
    public string Name { get; } = name;
    public string Department { get; } = department;
    public int YearsOfService { get; } = yearsOfService;

    public string GetDescription()
    {
        return $"{Name} works in {Department} for {YearsOfService} years";
    }
}

public class Solution
{
    public static string DescribeEmployee(string name, string department, int yearsOfService)
    {
        return new Employee(name, department, yearsOfService).GetDescription();
    }
}
*/
