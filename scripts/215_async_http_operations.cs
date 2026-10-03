using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

// Exercise: Async HTTP Operations
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Fetch all URLs concurrently with Task.WhenAll and preserve input order.
//
// Methods and APIs to use:
// - Task.WhenAll
// - HttpClient
//
// Expected output:
// Fetch all URLs concurrently with Task.WhenAll and preserve input order.
public class Solution
{
    public static async Task<string[]> FetchAllConcurrently(string[] urls)
    {
    }
}

/*
Answer:

using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

// Task: Async HTTP Operations
// Fetch all URLs concurrently with Task.WhenAll and preserve input order.

public class Solution
{
    public static async Task<string[]> FetchAllConcurrently(string[] urls)
    {
        using HttpClient client = new();
        Task<string>[] requests = urls.Select(url => client.GetStringAsync(url)).ToArray();
        return await Task.WhenAll(requests);
    }
}
*/
