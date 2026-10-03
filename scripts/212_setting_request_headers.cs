using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

// Exercise: Setting Request Headers
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add Bearer authorization and Accept headers, then return the GET response content.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Add Bearer authorization and Accept headers, then return the GET response content.
public class Solution
{
    public static async Task<string> FetchWithHeaders(string url, string authToken, string acceptType)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

// Task: Setting Request Headers
// Add Bearer authorization and Accept headers, then return the GET response content.

public class Solution
{
    public static async Task<string> FetchWithHeaders(string url, string authToken, string acceptType)
    {
        using HttpClient client = new();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue(acceptType));

        return await client.GetStringAsync(url);
    }
}
*/
