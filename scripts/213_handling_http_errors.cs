using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Handling HTTP Errors
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return "Success" for a 2xx response and "Failed" for non-2xx responses
// or an HttpRequestException.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Return "Success" for a 2xx response and "Failed" for non-2xx responses
// or an HttpRequestException.
public class Solution
{
    public static async Task<string> SafeFetch(string url)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Threading.Tasks;

// Task: Handling HTTP Errors
// Return "Success" for a 2xx response and "Failed" for non-2xx responses
// or an HttpRequestException.

public class Solution
{
    public static async Task<string> SafeFetch(string url)
    {
        try
        {
            using HttpClient client = new();
            using HttpResponseMessage response = await client.GetAsync(url);
            return response.IsSuccessStatusCode ? "Success" : "Failed";
        }
        catch (HttpRequestException)
        {
            return "Failed";
        }
    }
}
*/
