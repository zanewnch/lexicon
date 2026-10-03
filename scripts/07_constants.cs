// Exercise: Constants in C#
//
// What you need to do:
// MathConstants.cs already provides three constants:
// - MathConstants.Pi, whose value is 3.14159.
// - MathConstants.DaysInWeek, whose value is 7.
// - MathConstants.HoursInDay, whose value is 24.
//
// Implement the three methods below by accessing those existing members with
// class-name dot notation. Do not create a new MathConstants object and do not
// redefine the constants in the solution method.
//
// Methods and syntax to use:
// - The const keyword and static members.
// - ClassName.MemberName dot notation, such as MathConstants.Pi.
// - Return the value directly from each method.
//
// Expected output:
// GetCircleConstant() -> 3.14159
// GetDaysInWeek() -> 7
// GetHoursInDay() -> 24
public class Solution
{
    public static double GetCircleConstant()
    {
        double result = 3.14159;
        return result;
    }

    public static int GetDaysInWeek()
    {
        int day = 7;
        return day;
    }

    public static int GetHoursInDay()
    {
        int hours = 24;
        return hours;
    }
}

/*
Answer:

// Task: Constants
// Access and return the values defined in MathConstants.

public static class MathConstants
{
    public const double Pi = 3.14159;
    public const int DaysInWeek = 7;
    public const int HoursInDay = 24;
}

public class Solution
{
    public static double GetCircleConstant()
    {
        return MathConstants.Pi;
    }

    public static int GetDaysInWeek()
    {
        return MathConstants.DaysInWeek;
    }

    public static int GetHoursInDay()
    {
        return MathConstants.HoursInDay;
    }
}
*/
