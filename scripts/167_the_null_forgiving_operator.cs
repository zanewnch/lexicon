// Exercise: The Null-Forgiving Operator
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Trust a guaranteed non-null string with !; otherwise return -1 for null.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Trust a guaranteed non-null string with !; otherwise return -1 for null.
public class Solution
{
    public static int GetStringLength(string? text, bool isGuaranteedNotNull)
    {
    }
}

/*
Answer:

// Task: The Null-Forgiving Operator
// Trust a guaranteed non-null string with !; otherwise return -1 for null.

public class Solution
{
    public static int GetStringLength(string? text, bool isGuaranteedNotNull)
    {
        if (isGuaranteedNotNull)
        {
            return text!.Length;
        }

        return text?.Length ?? -1;
    }
}
*/
