// Exercise: Defining Enums
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define DayOfWeek with Sunday through Saturday as values 0 through 6,
// then classify Saturday and Sunday as weekends.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define DayOfWeek with Sunday through Saturday as values 0 through 6,
// then classify Saturday and Sunday as weekends.
public class Solution
{
    public static string GetDayType(DayOfWeek day)
    {
    }
}

/*
Answer:

// Task: Defining Enums
// Define DayOfWeek with Sunday through Saturday as values 0 through 6,
// then classify Saturday and Sunday as weekends.

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
        return day == DayOfWeek.Saturday || day == DayOfWeek.Sunday
            ? "Weekend"
            : "Weekday";
    }
}
*/
