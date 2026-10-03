using System;

// Exercise: Subscribing to Events
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Subscribe handlers to OrderReceived and OrderCompleted and print both messages.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Subscribe handlers to OrderReceived and OrderCompleted and print both messages.
public class Solution
{
    public static void RunOrderSystem(string[] orderNames)
    {
    }
}

/*
Answer:

using System;

// Task: Subscribing to Events
// Subscribe handlers to OrderReceived and OrderCompleted and print both messages.

public class OrderProcessor
{
    public event Action<string>? OrderReceived;
    public event Action<string>? OrderCompleted;

    public void Process(string orderName)
    {
        OrderReceived?.Invoke(orderName);
        OrderCompleted?.Invoke(orderName);
    }
}

public class Solution
{
    public static void RunOrderSystem(string[] orderNames)
    {
        OrderProcessor processor = new OrderProcessor();
        processor.OrderReceived += orderName => Console.WriteLine($"Order received: {orderName}");
        processor.OrderCompleted += orderName => Console.WriteLine($"Order completed: {orderName}");

        foreach (string orderName in orderNames)
        {
            processor.Process(orderName);
        }
    }
}
*/
