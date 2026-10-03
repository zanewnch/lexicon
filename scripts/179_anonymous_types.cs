// Exercise: Anonymous Types
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Store product data in an anonymous type and format its price to two decimals.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Store product data in an anonymous type and format its price to two decimals.
public class Solution
{
    public static string DescribeProduct(string name, decimal price, int quantity)
    {
    }
}

/*
Answer:

// Task: Anonymous Types
// Store product data in an anonymous type and format its price to two decimals.

public class Solution
{
    public static string DescribeProduct(string name, decimal price, int quantity)
    {
        var product = new
        {
            Name = name,
            Price = price,
            Quantity = quantity
        };

        return $"Product: {product.Name}, Price: ${product.Price:F2}, Qty: {product.Quantity}";
    }
}
*/
