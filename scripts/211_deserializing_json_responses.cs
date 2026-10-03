using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

// Exercise: Deserializing JSON Responses
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Fetch a JSON response and return either the user's Name or Age property.
//
// Methods and APIs to use:
// - HttpClient
// - JsonSerializer.Deserialize
//
// Expected output:
// Fetch a JSON response and return either the user's Name or Age property.
public class Solution
{
    public static async Task<string> GetUserName(string url)
    {
    }

    public static async Task<int> GetUserAge(string url)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

// Task: Deserializing JSON Responses
// Fetch a JSON response and return either the user's Name or Age property.

public class User
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }
}

public class Solution
{
    public static async Task<string> GetUserName(string url)
    {
        using HttpClient client = new();
        string json = await client.GetStringAsync(url);
        User user = JsonSerializer.Deserialize<User>(json);
        return user.Name;
    }

    public static async Task<int> GetUserAge(string url)
    {
        using HttpClient client = new();
        string json = await client.GetStringAsync(url);
        User user = JsonSerializer.Deserialize<User>(json);
        return user.Age;
    }
}
*/
