using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Making GET Requests
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Fetch and return the text content from the provided URL by using GetStringAsync.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Fetch and return the text content from the provided URL by using GetStringAsync.
public class Solution
{
    public static async Task<string> FetchContent(string url)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Threading.Tasks;

// Task: Making GET Requests
// Fetch and return the text content from the provided URL by using GetStringAsync.

public class Solution
{
    public static async Task<string> FetchContent(string url)
    {
        using HttpClient client = new();
        return await client.GetStringAsync(url);
    }
}
*/
