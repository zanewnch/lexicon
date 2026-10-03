// Exercise: Implementing Interfaces
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Implement Car.Move so each movement is added to TotalDistance.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Implement Car.Move so each movement is added to TotalDistance.
public class Solution
{
    public static int GetTotalDistanceTraveled(Car car, int[] movements)
    {
    }
}

/*
Answer:

// Task: Implementing Interfaces
// Implement Car.Move so each movement is added to TotalDistance.

public interface IMovable
{
    void Move(int distance);
    int TotalDistance { get; }
}

public class Car : IMovable
{
    public Car(string name)
    {
        Name = name;
    }

    public string Name { get; }
    public int TotalDistance { get; private set; }

    public void Move(int distance)
    {
        TotalDistance += distance;
    }
}

public class Solution
{
    public static int GetTotalDistanceTraveled(Car car, int[] movements)
    {
        foreach (int distance in movements)
        {
            car.Move(distance);
        }

        return car.TotalDistance;
    }
}
*/
