// Exercise: Substring
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the first five characters, or the entire string when it is shorter.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the first five characters, or the entire string when it is shorter.
public class Solution
{
    public static string GetFirstFiveCharacters(string text)
    {
    }
}

/*
Answer:

// Task: Substring
// Return the first five characters, or the entire string when it is shorter.

public class Solution
{
    public static string GetFirstFiveCharacters(string text)
    {
        return text.Length <= 5 ? text : text.Substring(0, 5);
    }
}
*/
