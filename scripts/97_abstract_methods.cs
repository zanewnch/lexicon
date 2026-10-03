// Exercise: Abstract Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Declare Shape.GetArea as abstract and override it in Rectangle.
// public abstract class Shape
// {
//     public abstract double GetArea();
// }
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Declare Shape.GetArea as abstract and override it in Rectangle.
// public abstract class Shape
// {
//     public abstract double GetArea();
// }
public class Solution
{
    public static double CalculateArea(double width, double height)
    {
    }
}

/*
Answer:

// Task: Abstract Methods
// Declare Shape.GetArea as abstract and override it in Rectangle.

public abstract class Shape
{
    public abstract double GetArea();
}

public class Rectangle : Shape
{
    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    public double Width { get; }
    public double Height { get; }

    public override double GetArea()
    {
        return Width * Height;
    }
}

public class Solution
{
    public static double CalculateArea(double width, double height)
    {
        return new Rectangle(width, height).GetArea();
    }
}
*/
