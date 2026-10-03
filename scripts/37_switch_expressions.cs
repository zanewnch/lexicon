// Exercise: Switch expressions
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Convert day numbers 1 through 7 to day names with a switch expression.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Convert day numbers 1 through 7 to day names with a switch expression.
public class Solution
{
    public static string GetDayName(int dayNumber)
    {
    }
}

/*
Answer:

// Task: Switch expressions
// Convert day numbers 1 through 7 to day names with a switch expression.

public class Solution
{
    public static string GetDayName(int dayNumber)
    {
        return dayNumber switch
        {
            1 => "Monday",
            2 => "Tuesday",
            3 => "Wednesday",
            4 => "Thursday",
            5 => "Friday",
            6 => "Saturday",
            7 => "Sunday",
            _ => "Invalid day"
        };
    }
}
*/
