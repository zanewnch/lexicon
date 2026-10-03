// Exercise: Using return values
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add two integers, then use Add's return value inside Calculate.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Add two integers, then use Add's return value inside Calculate.
public class Solution
{
    public static int Add(int x, int y)
    {
    }

    public static int Calculate(int a, int b, int c)
    {
    }
}

/*
Answer:

// Task: Using return values
// Add two integers, then use Add's return value inside Calculate.

public class Solution
{
    public static int Add(int x, int y)
    {
        return x + y;
    }

    public static int Calculate(int a, int b, int c)
    {
        return Add(a, b) * c;
    }
}
*/
