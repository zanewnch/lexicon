// Exercise: Switch Expressions
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a description for day numbers 1 through 7 with a switch expression.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a description for day numbers 1 through 7 with a switch expression.
public class Solution
{
    public static string GetDayType(int dayNumber)
    {
    }
}

/*
Answer:

// Task: Switch Expressions
// Return a description for day numbers 1 through 7 with a switch expression.

public class Solution
{
    public static string GetDayType(int dayNumber)
    {
        return dayNumber switch
        {
            1 => "Monday - Start of work week",
            2 => "Tuesday",
            3 => "Wednesday",
            4 => "Thursday",
            5 => "Friday - End of work week",
            6 => "Saturday - Weekend",
            7 => "Sunday - Weekend",
            _ => "Invalid day"
        };
    }
}
*/
