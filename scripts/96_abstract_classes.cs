using System;

// Exercise: Abstract Classes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define an abstract Shape and implement area and perimeter for circles and rectangles.
// public abstract class Shape
// {
//     public abstract double CalculateArea();
//     public abstract double CalculatePerimeter();
// }
//
// Methods and APIs to use:
// - Math.PI
//
// Expected output:
// Define an abstract Shape and implement area and perimeter for circles and rectangles.
// public abstract class Shape
// {
//     public abstract double CalculateArea();
//     public abstract double CalculatePerimeter();
// }
public class Solution
{
    public static double GetCircleArea(double radius)
    {
    }

    public static double GetCirclePerimeter(double radius)
    {
    }

    public static double GetRectangleArea(double width, double height)
    {
    }

    public static double GetRectanglePerimeter(double width, double height)
    {
    }
}

/*
Answer:

using System;

// Task: Abstract Classes
// Define an abstract Shape and implement area and perimeter for circles and rectangles.

public abstract class Shape
{
    public abstract double CalculateArea();
    public abstract double CalculatePerimeter();
}

public class Circle : Shape
{
    public Circle(double radius)
    {
        Radius = radius;
    }

    public double Radius { get; }

    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }

    public override double CalculatePerimeter()
    {
        return 2 * Math.PI * Radius;
    }
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

    public override double CalculateArea()
    {
        return Width * Height;
    }

    public override double CalculatePerimeter()
    {
        return 2 * (Width + Height);
    }
}

public class Solution
{
    public static double GetCircleArea(double radius)
    {
        return new Circle(radius).CalculateArea();
    }

    public static double GetCirclePerimeter(double radius)
    {
        return new Circle(radius).CalculatePerimeter();
    }

    public static double GetRectangleArea(double width, double height)
    {
        return new Rectangle(width, height).CalculateArea();
    }

    public static double GetRectanglePerimeter(double width, double height)
    {
        return new Rectangle(width, height).CalculatePerimeter();
    }
}
*/
