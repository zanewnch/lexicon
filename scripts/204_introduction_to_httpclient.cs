using System.Net.Http;

// Exercise: Introduction to HttpClient
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create and return a new HttpClient without disposing it in this method.
//
// Methods and APIs to use:
// - HttpClient
//
// Expected output:
// Create and return a new HttpClient without disposing it in this method.
public class Solution
{
    public static HttpClient CreateHttpClient()
    {
    }
}

/*
Answer:

using System.Net.Http;

// Task: Introduction to HttpClient
// Create and return a new HttpClient without disposing it in this method.

public class Solution
{
    public static HttpClient CreateHttpClient()
    {
        return new HttpClient();
    }
}
*/
