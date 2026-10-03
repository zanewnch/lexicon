// Exercise: Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Encapsulate Product name and price with private backing fields.
// Reject non-positive prices by keeping the price at its default value.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Encapsulate Product name and price with private backing fields.
// Reject non-positive prices by keeping the price at its default value.
public class Solution
{
    public static string GetProductInfo(string name, decimal price)
    {
    }
}

/*
Answer:

// Task: Properties
// Encapsulate Product name and price with private backing fields.
// Reject non-positive prices by keeping the price at its default value.

public class Product
{
    private string _name = string.Empty;
    private decimal _price;

    public string Name
    {
        get { return _name; }
        set { _name = value; }
    }

    public decimal Price
    {
        get { return _price; }
        set
        {
            if (value > 0)
            {
                _price = value;
            }
        }
    }
}

public class Solution
{
    public static string GetProductInfo(string name, decimal price)
    {
        Product product = new Product
        {
            Name = name,
            Price = price
        };

        return $"{product.Name}: ${product.Price}";
    }
}
*/
