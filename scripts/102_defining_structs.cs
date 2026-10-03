// Exercise: Defining Structs
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define a Point struct with public X and Y fields and describe a point.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define a Point struct with public X and Y fields and describe a point.
public class Solution
{
    public static string DescribePoint(int x, int y)
    {
    }
}

/*
Answer:

// Task: Defining Structs
// Define a Point struct with public X and Y fields and describe a point.

public struct Point
{
    public int X;
    public int Y;
}

public class Solution
{
    public static string DescribePoint(int x, int y)
    {
        Point point = new Point
        {
            X = x,
            Y = y
        };

        return $"Point({point.X}, {point.Y})";
    }
}
*/
