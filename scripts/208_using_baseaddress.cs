using System;
using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Using BaseAddress
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Set the client's BaseAddress and fetch content from the provided relative path.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Set the client's BaseAddress and fetch content from the provided relative path.
public class Solution
{
    public static async Task<string> FetchWithBaseAddress(string baseUrl, string relativePath)
    {
    }
}

/*
Answer:

using System;
using System.Net.Http;
using System.Threading.Tasks;

// Task: Using BaseAddress
// Set the client's BaseAddress and fetch content from the provided relative path.

public class Solution
{
    public static async Task<string> FetchWithBaseAddress(string baseUrl, string relativePath)
    {
        using HttpClient client = new()
        {
            BaseAddress = new Uri(baseUrl)
        };

        return await client.GetStringAsync(relativePath);
    }
}
*/
