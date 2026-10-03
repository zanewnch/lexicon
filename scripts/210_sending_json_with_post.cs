using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

// Exercise: Sending JSON with POST
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Post a Person as JSON once with StringContent and once with PostAsJsonAsync.
//
// Methods and APIs to use:
// - JsonSerializer.Serialize
// - HttpClient
//
// Expected output:
// Post a Person as JSON once with StringContent and once with PostAsJsonAsync.
public class Solution
{
    public static async Task<int> PostJsonContent(string url, string name, int age)
    {
    }

    public static async Task<int> PostWithJsonExtension(string url, string name, int age)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

// Task: Sending JSON with POST
// Post a Person as JSON once with StringContent and once with PostAsJsonAsync.

public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}

public class Solution
{
    public static async Task<int> PostJsonContent(string url, string name, int age)
    {
        Person person = new() { Name = name, Age = age };
        string json = JsonSerializer.Serialize(person);
        using StringContent content = new(json, Encoding.UTF8, "application/json");
        using HttpClient client = new();
        using HttpResponseMessage response = await client.PostAsync(url, content);
        return (int)response.StatusCode;
    }

    public static async Task<int> PostWithJsonExtension(string url, string name, int age)
    {
        Person person = new() { Name = name, Age = age };
        using HttpClient client = new();
        using HttpResponseMessage response = await client.PostAsJsonAsync(url, person);
        return (int)response.StatusCode;
    }
}
*/
