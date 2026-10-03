using System.Linq;
using System.Threading.Tasks;

// Exercise: Task.WhenAll
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Run three value-processing operations in parallel and return their sum.
//
// Methods and APIs to use:
// - Task.WhenAll
// - Task.Delay
//
// Expected output:
// Run three value-processing operations in parallel and return their sum.
public class Solution
{
    private static async Task<int> ProcessValueAsync(int value, int delayMs)
    {
    }
}

/*
Answer:

using System.Linq;
using System.Threading.Tasks;

// Task: Task.WhenAll
// Run three value-processing operations in parallel and return their sum.

public class Solution
{
    public static async Task<int> SumOfThreeDelaysAsync(
        int value1, int delay1,
        int value2, int delay2,
        int value3, int delay3)
    {
        Task<int> first = ProcessValueAsync(value1, delay1);
        Task<int> second = ProcessValueAsync(value2, delay2);
        Task<int> third = ProcessValueAsync(value3, delay3);

        int[] results = await Task.WhenAll(first, second, third);
        return results.Sum();
    }

    private static async Task<int> ProcessValueAsync(int value, int delayMs)
    {
        await Task.Delay(delayMs);
        return value * 2;
    }
}
*/
