// Exercise: Enums in Switch
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use a switch statement to classify enum days as weekdays or weekends.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use a switch statement to classify enum days as weekdays or weekends.
public class Solution
{
    public static string GetDayType(DayOfWeek day)
    {
    }
}

/*
Answer:

// Task: Enums in Switch
// Use a switch statement to classify enum days as weekdays or weekends.

public enum DayOfWeek
{
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}

public class Solution
{
    public static string GetDayType(DayOfWeek day)
    {
        switch (day)
        {
            case DayOfWeek.Saturday:
            case DayOfWeek.Sunday:
                return "Weekend";
            default:
                return "Weekday";
        }
    }
}
*/
