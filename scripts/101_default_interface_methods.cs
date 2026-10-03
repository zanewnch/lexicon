// Exercise: Default interface methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Let Bicycle use IVehicle's default description and override it for Car.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Let Bicycle use IVehicle's default description and override it for Car.
public class Solution
{
    public static string GetVehicleInfo(IVehicle vehicle)
    {
    }
}

/*
Answer:

// Task: Default interface methods
// Let Bicycle use IVehicle's default description and override it for Car.

public interface IVehicle
{
    string Brand { get; }

    string GetDescription()
    {
        return $"Vehicle: {Brand}";
    }
}

public class Bicycle : IVehicle
{
    public Bicycle(string brand)
    {
        Brand = brand;
    }

    public string Brand { get; }
}

public class Car : IVehicle
{
    public Car(string brand, int horsepower)
    {
        Brand = brand;
        Horsepower = horsepower;
    }

    public string Brand { get; }
    public int Horsepower { get; }

    public string GetDescription()
    {
        return $"Car: {Brand} ({Horsepower} HP)";
    }
}

public class Solution
{
    public static string GetVehicleInfo(IVehicle vehicle)
    {
        return vehicle.GetDescription();
    }
}
*/
