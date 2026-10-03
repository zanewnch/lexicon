// Exercise: Multiple Interfaces
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Implement both IMovable and ISoundMaker on Robot and combine their results.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Implement both IMovable and ISoundMaker on Robot and combine their results.
public class Solution
{
    public static string TestRobot(Robot robot)
    {
    }
}

/*
Answer:

// Task: Multiple Interfaces
// Implement both IMovable and ISoundMaker on Robot and combine their results.

public interface IMovable
{
    string Move();
}

public interface ISoundMaker
{
    string MakeSound();
}

public class Robot : IMovable, ISoundMaker
{
    public string Move()
    {
        return "Moving forward";
    }

    public string MakeSound()
    {
        return "Beep boop!";
    }
}

public class Solution
{
    public static string TestRobot(Robot robot)
    {
        return $"{robot.Move()} {robot.MakeSound()}";
    }
}
*/
