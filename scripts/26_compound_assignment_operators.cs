// Exercise: Compound assignment operators
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Implement each operation with its corresponding compound assignment operator.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Implement each operation with its corresponding compound assignment operator.
public class Solution
{
  public static int ApplyAdditionAssignment(int value, int amount)
  {
    value += amount;
    return value;
  }

  public static int ApplySubtractionAssignment(int value, int amount)
  {
    value -= amount;
    return value;
  }

  public static int ApplyMultiplicationAssignment(int value, int amount)
  {
    value *= amount;
    return value;
  }

  public static int ApplyDivisionAssignment(int value, int amount)
  {
    value /= amount;
    return value;
  }
}

/*
Answer:

// Task: Compound assignment operators
// Implement each operation with its corresponding compound assignment operator.

public class Solution
{
    public static int ApplyAdditionAssignment(int value, int amount)
    {
        value += amount;
        return value;
    }

    public static int ApplySubtractionAssignment(int value, int amount)
    {
        value -= amount;
        return value;
    }

    public static int ApplyMultiplicationAssignment(int value, int amount)
    {
        value *= amount;
        return value;
    }

    public static int ApplyDivisionAssignment(int value, int amount)
    {
        value /= amount;
        return value;
    }
}
*/
