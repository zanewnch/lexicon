// Exercise: Logical patterns
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Classify an integer using relational and logical patterns.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Classify an integer using relational and logical patterns.
public class Solution
{
  public static string ClassifyNumber(int number)
  {
    if (number is 0 or 1)
    {
      return "edge";
    }

    if (number is >= 2 and <= 9)
    {
      return "small positive";
    }

    if (number is not > 0)
    {
      return "non-positive";
    }

    if (number is >= 10 and <= 100)
    {
      return "medium";
    }

    return "large";
  }
}

/*
Answer:

// Task: Logical patterns
// Classify an integer using relational and logical patterns.

public class Solution
{
    public static string ClassifyNumber(int number)
    {
        if (number is 0 or 1)
        {
            return "edge";
        }

        if (number is >= 2 and <= 9)
        {
            return "small positive";
        }

        if (number is not > 0)
        {
            return "non-positive";
        }

        if (number is >= 10 and <= 100)
        {
            return "medium";
        }

        return "large";
    }
}
*/
