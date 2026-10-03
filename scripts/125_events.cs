using System;

// Exercise: Events
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Raise TemperatureAlert when a temperature reaches at least 100 degrees,
// then subscribe a handler that prints the alert.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Raise TemperatureAlert when a temperature reaches at least 100 degrees,
// then subscribe a handler that prints the alert.
public class Solution
{
    public static void RunTemperatureMonitor(int[] temperatures)
    {
    }

    private static void HandleTemperatureAlert(object? sender, int temperature)
    {
    }
}

/*
Answer:

using System;

// Task: Events
// Raise TemperatureAlert when a temperature reaches at least 100 degrees,
// then subscribe a handler that prints the alert.

public class TemperatureMonitor
{
    public event EventHandler<int>? TemperatureAlert;

    public void CheckTemperature(int temperature)
    {
        if (temperature >= 100)
        {
            TemperatureAlert?.Invoke(this, temperature);
        }
    }
}

public class Solution
{
    public static void RunTemperatureMonitor(int[] temperatures)
    {
        TemperatureMonitor monitor = new TemperatureMonitor();
        monitor.TemperatureAlert += HandleTemperatureAlert;

        foreach (int temperature in temperatures)
        {
            monitor.CheckTemperature(temperature);
        }
    }

    private static void HandleTemperatureAlert(object? sender, int temperature)
    {
        Console.WriteLine($"ALERT: Temperature is {temperature} degrees!");
    }
}
*/
