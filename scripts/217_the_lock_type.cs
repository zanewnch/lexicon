using System.Threading;
using System.Threading.Tasks;

// Exercise: The Lock Type
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Safely increment the counter with the Lock type while multiple threads
// perform increments at the same time.
//
// Methods and APIs to use:
// - Lock
//
// Expected output:
// Safely increment the counter with the Lock type while multiple threads
// perform increments at the same time.
public class Solution
{
    private static void SafeIncrement()
    {
    }

    public static int IncrementCounter(int count)
    {
    }
}

/*
Answer:

using System.Threading;
using System.Threading.Tasks;

// Task: The Lock Type
// Safely increment the counter with the Lock type while multiple threads
// perform increments at the same time.

public class Solution
{
    private static int _counter;
    private static readonly Lock CounterLock = new();

    private static void SafeIncrement()
    {
        lock (CounterLock)
        {
            _counter++;
        }
    }

    public static int IncrementCounter(int count)
    {
        _counter = 0;
        Parallel.For(0, count, _ => SafeIncrement());
        return _counter;
    }
}
*/
