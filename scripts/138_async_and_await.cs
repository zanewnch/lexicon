using System.Threading.Tasks;

// Exercise: Async and Await
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Await the requested delay and return a personalized greeting.
//
// Methods and APIs to use:
// - Task.Delay
//
// Expected output:
// Await the requested delay and return a personalized greeting.
public class Solution
{
    public static async Task<string> DelayedGreetingAsync(string name, int delayMs)
    {
    }
}

/*
Answer:

using System.Threading.Tasks;

// Task: Async and Await
// Await the requested delay and return a personalized greeting.

public class Solution
{
    public static async Task<string> DelayedGreetingAsync(string name, int delayMs)
    {
        await Task.Delay(delayMs);
        return $"Hello, {name}!";
    }
}
*/
