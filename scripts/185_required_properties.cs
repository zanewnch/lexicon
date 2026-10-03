// Exercise: Required Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a Product with required Name, Price, and Category properties.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a Product with required Name, Price, and Category properties.
public class Solution
{
    public static string CreateProduct(string name, decimal price, string category)
    {
    }
}

/*
Answer:

// Task: Required Properties
// Create a Product with required Name, Price, and Category properties.

public class Product
{
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public required string Category { get; init; }
}

public class Solution
{
    public static string CreateProduct(string name, decimal price, string category)
    {
        Product product = new Product
        {
            Name = name,
            Price = price,
            Category = category
        };

        return $"Product: {product.Name}, Price: ${product.Price:F2}, Category: {product.Category}";
    }
}
*/
