// Exercise: Defining Delegates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define a two-int MathOperation delegate and invoke it from ApplyOperation.
// public delegate int MathOperation(int x, int y);
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define a two-int MathOperation delegate and invoke it from ApplyOperation.
// public delegate int MathOperation(int x, int y);
public class Solution
{
    public static int ApplyOperation(int a, int b, MathOperation operation)
    {
    }
}

/*
Answer:

// Task: Defining Delegates
// Define a two-int MathOperation delegate and invoke it from ApplyOperation.

public delegate int MathOperation(int x, int y);

public class Solution
{
    public static int ApplyOperation(int a, int b, MathOperation operation)
    {
        return operation(a, b);
    }
}
*/
