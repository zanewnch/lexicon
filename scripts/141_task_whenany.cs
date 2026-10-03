using System.Threading.Tasks;

// Exercise: Task.WhenAny
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Start three delayed messages and return the message from the first task to finish.
//
// Methods and APIs to use:
// - Task.WhenAny
// - Task.Delay
//
// Expected output:
// Start three delayed messages and return the message from the first task to finish.
public class Solution
{
    private static async Task<string> DelayedMessageAsync(string message, int delayMs)
    {
    }
}

/*
Answer:

using System.Threading.Tasks;

// Task: Task.WhenAny
// Start three delayed messages and return the message from the first task to finish.

public class Solution
{
    public static async Task<string> FirstToCompleteAsync(
        string message1, int delay1,
        string message2, int delay2,
        string message3, int delay3)
    {
        Task<string> first = DelayedMessageAsync(message1, delay1);
        Task<string> second = DelayedMessageAsync(message2, delay2);
        Task<string> third = DelayedMessageAsync(message3, delay3);

        Task<string> completedTask = await Task.WhenAny(first, second, third);
        return await completedTask;
    }

    private static async Task<string> DelayedMessageAsync(string message, int delayMs)
    {
        await Task.Delay(delayMs);
        return message;
    }
}
*/
