using System.Text.Json;

// Exercise: JSON Deserialization
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Deserialize the JSON product string into and return a Product object.
//
// Methods and APIs to use:
// - JsonSerializer.Deserialize
//
// Expected output:
// Deserialize the JSON product string into and return a Product object.
public class Solution
{
    public static Product DeserializeProduct(string json)
    {
    }
}

/*
Answer:

using System.Text.Json;

// Task: JSON Deserialization
// Deserialize the JSON product string into and return a Product object.

public class Product
{
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class Solution
{
    public static Product DeserializeProduct(string json)
    {
        return JsonSerializer.Deserialize<Product>(json);
    }
}
*/
