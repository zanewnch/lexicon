using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Checking Status Codes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return "OK" for 200, "Not Found" for 404, and "Error" for every other status.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Return "OK" for 200, "Not Found" for 404, and "Error" for every other status.
public class Solution
{
    public static async Task<string> CheckStatusCode(string url)
    {
    }
}

/*
Answer:

using System.Net.Http;
using System.Threading.Tasks;

// Task: Checking Status Codes
// Return "OK" for 200, "Not Found" for 404, and "Error" for every other status.

public class Solution
{
    public static async Task<string> CheckStatusCode(string url)
    {
        using HttpClient client = new();
        using HttpResponseMessage response = await client.GetAsync(url);

        return (int)response.StatusCode switch
        {
            200 => "OK",
            404 => "Not Found",
            _ => "Error"
        };
    }
}
*/
