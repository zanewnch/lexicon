// Exercise: The static keyword
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use a static counter to generate sequential IDs and provide read/reset methods.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use a static counter to generate sequential IDs and provide read/reset methods.
public class Solution
{
    public static int GetNextId()
    {
    }

    public static int GetCurrentCount()
    {
    }

    public static void ResetCounter()
    {
    }
}

/*
Answer:

// Task: The static keyword
// Use a static counter to generate sequential IDs and provide read/reset methods.

public class Solution
{
    private static int _counter;

    public static int GetNextId()
    {
        _counter++;
        return _counter;
    }

    public static int GetCurrentCount()
    {
        return _counter;
    }

    public static void ResetCounter()
    {
        _counter = 0;
    }
}
*/
