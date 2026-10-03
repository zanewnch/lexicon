// Exercise: Params arguments
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Sum any number of integer arguments, including zero arguments.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Sum any number of integer arguments, including zero arguments.
public class Solution
{
    public static int SumAll(params int[] numbers)
    {
    }
}

/*
Answer:

// Task: Params arguments
// Sum any number of integer arguments, including zero arguments.

public class Solution
{
    public static int SumAll(params int[] numbers)
    {
        int total = 0;

        foreach (int number in numbers)
        {
            total += number;
        }

        return total;
    }
}
*/
