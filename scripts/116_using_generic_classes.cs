// Exercise: Using Generic Classes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create an integer Box and a string Box, then return both in a tuple.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create an integer Box and a string Box, then return both in a tuple.
public class Solution
{
    public static (Box<int>, Box<string>) CreateBoxes(int number, string text)
    {
    }

    public static string GetBoxContents(int number, string text)
    {
    }
}

/*
Answer:

// Task: Using Generic Classes
// Create an integer Box and a string Box, then return both in a tuple.

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
    public static (Box<int>, Box<string>) CreateBoxes(int number, string text)
    {
        return (new Box<int>(number), new Box<string>(text));
    }

    public static string GetBoxContents(int number, string text)
    {
        (Box<int> integerBox, Box<string> stringBox) = CreateBoxes(number, text);
        return $"Int: {integerBox.Value}, String: {stringBox.Value}";
    }
}
*/
