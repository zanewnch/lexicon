using System.Text.Json;

// Exercise: JSON Serialization
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a Product from the provided values and serialize it to JSON.
//
// Methods and APIs to use:
// - JsonSerializer.Serialize
//
// Expected output:
// Create a Product from the provided values and serialize it to JSON.
public class Solution
{
    public static string SerializeProduct(string name, decimal price, int quantity)
    {
    }
}

/*
Answer:

using System.Text.Json;

// Task: JSON Serialization
// Create a Product from the provided values and serialize it to JSON.

public class Product
{
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class Solution
{
    public static string SerializeProduct(string name, decimal price, int quantity)
    {
        Product product = new()
        {
            Name = name,
            Price = price,
            Quantity = quantity
        };

        return JsonSerializer.Serialize(product);
    }
}
*/
