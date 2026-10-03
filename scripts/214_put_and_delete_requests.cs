using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

// Exercise: PUT and DELETE Requests
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Execute a PUT with an optional JSON body or a DELETE without a body,
// then return the HTTP status code.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Execute a PUT with an optional JSON body or a DELETE without a body,
// then return the HTTP status code.
public class Solution
{
    public static async Task<int> ExecuteRequest(string url, string method, string jsonContent = null)
    {
    }
}

/*
Answer:

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

// Task: PUT and DELETE Requests
// Execute a PUT with an optional JSON body or a DELETE without a body,
// then return the HTTP status code.

public class Solution
{
    public static async Task<int> ExecuteRequest(string url, string method, string jsonContent = null)
    {
        using HttpClient client = new();
        using HttpResponseMessage response;

        if (string.Equals(method, "PUT", StringComparison.OrdinalIgnoreCase))
        {
            using StringContent content = new(jsonContent ?? string.Empty, Encoding.UTF8, "application/json");
            response = await client.PutAsync(url, content);
        }
        else if (string.Equals(method, "DELETE", StringComparison.OrdinalIgnoreCase))
        {
            response = await client.DeleteAsync(url);
        }
        else
        {
            throw new ArgumentException("HTTP method must be PUT or DELETE.", nameof(method));
        }

        return (int)response.StatusCode;
    }
}
*/
