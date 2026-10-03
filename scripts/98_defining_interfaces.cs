// Exercise: Defining Interfaces
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define IMovable and use it to test vehicles that implement Move().
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define IMovable and use it to test vehicles that implement Move().
public class Solution
{
    public static string TestMovement(IMovable movable)
    {
    }
}

/*
Answer:

// Task: Defining Interfaces
// Define IMovable and use it to test vehicles that implement Move().

public interface IMovable
{
    string Move();
}

public class Car : IMovable
{
    public Car(string name)
    {
        Name = name;
    }

    public string Name { get; }

    public string Move()
    {
        return $"{Name} is driving on the road";
    }
}

public class Boat : IMovable
{
    public Boat(string name)
    {
        Name = name;
    }

    public string Name { get; }

    public string Move()
    {
        return $"{Name} is sailing on water";
    }
}

public class Airplane : IMovable
{
    public Airplane(string name)
    {
        Name = name;
    }

    public string Name { get; }

    public string Move()
    {
        return $"Flight {Name} is flying through the sky";
    }
}

public class Solution
{
    public static string TestMovement(IMovable movable)
    {
        return movable.Move();
    }
}
*/
