using System;

// Exercise: TimeOnly Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Format a time, calculate minutes until a target (possibly tomorrow),
// and check whether a time is within 09:00 inclusive through 17:00 exclusive.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Format a time, calculate minutes until a target (possibly tomorrow),
// and check whether a time is within 09:00 inclusive through 17:00 exclusive.
public class Solution
{
    public static string FormatTime(int hour, int minute, int second)
    {
    }

    public static int GetMinutesUntil(int currentHour, int currentMinute, int targetHour, int targetMinute)
    {
    }

    public static bool IsBusinessHours(int hour, int minute)
    {
    }
}

/*
Answer:

using System;

// Task: TimeOnly Basics
// Format a time, calculate minutes until a target (possibly tomorrow),
// and check whether a time is within 09:00 inclusive through 17:00 exclusive.

public class Solution
{
    public static string FormatTime(int hour, int minute, int second)
    {
        TimeOnly time = new TimeOnly(hour, minute, second);
        return time.ToString("HH:mm:ss");
    }

    public static int GetMinutesUntil(int currentHour, int currentMinute, int targetHour, int targetMinute)
    {
        TimeOnly current = new TimeOnly(currentHour, currentMinute);
        TimeOnly target = new TimeOnly(targetHour, targetMinute);
        int minutes = (int)(target - current).TotalMinutes;
        return minutes < 0 ? minutes + 24 * 60 : minutes;
    }

    public static bool IsBusinessHours(int hour, int minute)
    {
        TimeOnly time = new TimeOnly(hour, minute);
        return time >= new TimeOnly(9, 0) && time < new TimeOnly(17, 0);
    }
}
*/
