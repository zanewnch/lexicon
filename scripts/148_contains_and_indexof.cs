// Exercise: Contains and IndexOf
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return the starting position of word, or -1 when it is not contained in text.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return the starting position of word, or -1 when it is not contained in text.
public class Solution
{
    public static int FindWordPosition(string text, string word)
    {
    }
}

/*
Answer:

// Task: Contains and IndexOf
// Return the starting position of word, or -1 when it is not contained in text.

public class Solution
{
    public static int FindWordPosition(string text, string word)
    {
        return text.Contains(word) ? text.IndexOf(word) : -1;
    }
}
*/
