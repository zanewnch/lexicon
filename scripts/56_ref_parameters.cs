// Exercise: ref Parameters
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Swap two integers through ref parameters, then return their formatted values.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Swap two integers through ref parameters, then return their formatted values.
public class Solution
{
    public static string Format(int a, int b)
    {
    }

    public static void Swap(ref int x, ref int y)
    {
    }

    public static string SwapAndReturn(int a, int b)
    {
    }
}

/*
Answer:

// Task: ref Parameters
// Swap two integers through ref parameters, then return their formatted values.

public static class ResultFormatter
{
    public static string Format(int a, int b)
    {
        return $"a={a}, b={b}";
    }
}

public class Solution
{
    public static void Swap(ref int x, ref int y)
    {
        int temporary = x;
        x = y;
        y = temporary;
    }

    public static string SwapAndReturn(int a, int b)
    {
        Swap(ref a, ref b);
        return ResultFormatter.Format(a, b);
    }
}
*/
