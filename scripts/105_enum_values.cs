// Exercise: Enum Values
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the underlying integer value of a DayOfWeek member.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the underlying integer value of a DayOfWeek member.
public class Solution
{
    public static int GetEnumValue(DayOfWeek day)
    {
    }
}

/*
Answer:

// Task: Enum Values
// Return the underlying integer value of a DayOfWeek member.

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
    public static int GetEnumValue(DayOfWeek day)
    {
        return (int)day;
    }
}
*/
