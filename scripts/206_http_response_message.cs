using System.Net.Http;
using System.Threading.Tasks;

// Exercise: HttpResponseMessage
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Make GET requests and use HttpResponseMessage to return a status code,
// success flag, or response body.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Make GET requests and use HttpResponseMessage to return a status code,
// success flag, or response body.
public class Solution
{
    public static async Task<int> GetStatusCode(string url)
    {
    }

    public static async Task<bool> IsRequestSuccessful(string url)
    {
    }

    public static async Task<string> ReadResponseContent(string url)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Threading.Tasks;

// Task: HttpResponseMessage
// Make GET requests and use HttpResponseMessage to return a status code,
// success flag, or response body.

public class Solution
{
    public static async Task<int> GetStatusCode(string url)
    {
        using HttpClient client = new();
        using HttpResponseMessage response = await client.GetAsync(url);
        return (int)response.StatusCode;
    }

    public static async Task<bool> IsRequestSuccessful(string url)
    {
        using HttpClient client = new();
        using HttpResponseMessage response = await client.GetAsync(url);
        return response.IsSuccessStatusCode;
    }

    public static async Task<string> ReadResponseContent(string url)
    {
        using HttpClient client = new();
        using HttpResponseMessage response = await client.GetAsync(url);
        return await response.Content.ReadAsStringAsync();
    }
}
*/
