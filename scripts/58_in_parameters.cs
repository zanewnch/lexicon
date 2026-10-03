using System;

// Exercise: in Parameters
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Calculate the distance from the origin to a Point supplied as an in parameter.
// public readonly struct Point
// {
//     public Point(double x, double y)
//     {
//         X = x;
//         Y = y;
//     }
//     public double X { get; }
//     public double Y { get; }
// }
//
// Methods and APIs to use:
// - Math.Sqrt
//
// Expected output:
// Calculate the distance from the origin to a Point supplied as an in parameter.
// public readonly struct Point
// {
//     public Point(double x, double y)
//     {
//         X = x;
//         Y = y;
//     }
//     public double X { get; }
//     public double Y { get; }
// }
public class Solution
{
    public static double DistanceFromOrigin(in Point point)
    {
    }
}

/*
Answer:

using System;

// Task: in Parameters
// Calculate the distance from the origin to a Point supplied as an in parameter.

public readonly struct Point
{
    public Point(double x, double y)
    {
        X = x;
        Y = y;
    }

    public double X { get; }
    public double Y { get; }
}

public class Solution
{
    public static double DistanceFromOrigin(in Point point)
    {
        return Math.Sqrt(point.X * point.X + point.Y * point.Y);
    }
}
*/
