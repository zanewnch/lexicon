// Exercise: Using Delegates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Execute the supplied Greeter delegate with the given name and return its result.
// public delegate string Greeter(string name);
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Execute the supplied Greeter delegate with the given name and return its result.
// public delegate string Greeter(string name);
public class Solution
{
    public static string ExecuteGreeting(string name, Greeter greeter)
    {
    }

    public static string FormalGreeting(string name)
    {
    }

    public static string CasualGreeting(string name)
    {
    }

    public static string ShortGreeting(string name)
    {
    }
}

/*
Answer:

// Task: Using Delegates
// Execute the supplied Greeter delegate with the given name and return its result.

public delegate string Greeter(string name);

public class Solution
{
    public static string ExecuteGreeting(string name, Greeter greeter)
    {
        return greeter(name);
    }

    public static string FormalGreeting(string name)
    {
        return $"Good day, {name}. How may I assist you?";
    }

    public static string CasualGreeting(string name)
    {
        return $"Hey {name}! What's up?";
    }

    public static string ShortGreeting(string name)
    {
        return $"Hi {name}!";
    }
}
*/
