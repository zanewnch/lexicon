using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Making POST Requests
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Send the provided string data in a POST request and return the status code.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Send the provided string data in a POST request and return the status code.
public class Solution
{
    public static async Task<int> PostData(string url, string data)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Threading.Tasks;

// Task: Making POST Requests
// Send the provided string data in a POST request and return the status code.

public class Solution
{
    public static async Task<int> PostData(string url, string data)
    {
        using HttpClient client = new();
        using StringContent content = new(data);
        using HttpResponseMessage response = await client.PostAsync(url, content);
        return (int)response.StatusCode;
    }
}
*/
