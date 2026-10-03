// Exercise: Else-If chains
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Convert a score from 0 to 100 into the letter grades A through F.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Convert a score from 0 to 100 into the letter grades A through F.
public class Solution
{
    public static string GetLetterGrade(int score)
    {
    }
}

/*
Answer:

// Task: Else-If chains
// Convert a score from 0 to 100 into the letter grades A through F.

public class Solution
{
    public static string GetLetterGrade(int score)
    {
        if (score >= 90)
        {
            return "A";
        }
        else if (score >= 80)
        {
            return "B";
        }
        else if (score >= 70)
        {
            return "C";
        }
        else if (score >= 60)
        {
            return "D";
        }

        return "F";
    }
}
*/
