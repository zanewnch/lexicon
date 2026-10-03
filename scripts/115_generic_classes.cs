// Exercise: Generic Classes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define Box<T> with a value property and constructor, then create and read boxes.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define Box<T> with a value property and constructor, then create and read boxes.
public class Solution
{
    public static Box<T> CreateBox<T>(T value)
    {
    }

    public static T GetBoxValue<T>(Box<T> box)
    {
    }
}

/*
Answer:

// Task: Generic Classes
// Define Box<T> with a value property and constructor, then create and read boxes.

public class Box<T>
{
    public Box(T value)
    {
        Value = value;
    }

    public T Value { get; }
}

public class Solution
{
    public static Box<T> CreateBox<T>(T value)
    {
        return new Box<T>(value);
    }

    public static T GetBoxValue<T>(Box<T> box)
    {
        return box.Value;
    }
}
*/
