// Exercise: Record With Expressions
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use with expressions to create updated copies of Person, Product, and Employee.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use with expressions to create updated copies of Person, Product, and Employee.
public class Solution
{
    public static Person UpdateAge(Person person, int newAge)
    {
    }

    public static Product ApplyDiscount(Product product, decimal newPrice)
    {
    }

    public static Employee Promote(Employee employee, string newTitle, int salaryIncrease)
    {
    }
}

/*
Answer:

// Task: Record With Expressions
// Use with expressions to create updated copies of Person, Product, and Employee.

public record Person(string Name, int Age);
public record Product(string Name, decimal Price, int Stock);
public record Employee(string Name, string Title, int Salary);

public class Solution
{
    public static Person UpdateAge(Person person, int newAge)
    {
        return person with { Age = newAge };
    }

    public static Product ApplyDiscount(Product product, decimal newPrice)
    {
        return product with { Price = newPrice };
    }

    public static Employee Promote(Employee employee, string newTitle, int salaryIncrease)
    {
        return employee with
        {
            Title = newTitle,
            Salary = employee.Salary + salaryIncrease
        };
    }
}
*/
