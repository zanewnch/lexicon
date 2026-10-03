// Exercise: Logical OR
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// A person can access restricted content when they are at least 18
// or have explicit permission.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// A person can access restricted content when they are at least 18
// or have explicit permission.
public class Solution
{
    public static bool CheckCondition(int age, bool hasPermission)
    {
    }
}

/*
Answer:

// Task: Logical OR
// A person can access restricted content when they are at least 18
// or have explicit permission.

public class Solution
{
    public static bool CheckCondition(int age, bool hasPermission)
    {
        return age >= 18 || hasPermission;
    }
}
*/
