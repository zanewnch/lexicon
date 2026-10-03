// Exercise: Unchecked Arithmetic
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add two integers inside an unchecked block so overflow wraps around.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Add two integers inside an unchecked block so overflow wraps around.
public class Solution
{
    public static int UncheckedAdd(int a, int b)
    {
    }
}

/*
Answer:

// Task: Unchecked Arithmetic
// Add two integers inside an unchecked block so overflow wraps around.

public class Solution
{
    public static int UncheckedAdd(int a, int b)
    {
        unchecked
        {
            return a + b;
        }
    }
}
*/
