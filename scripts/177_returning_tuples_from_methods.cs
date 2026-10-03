// Exercise: Returning Tuples from Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Find and return the minimum and maximum values as named tuple elements.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Find and return the minimum and maximum values as named tuple elements.
public class Solution
{
    public static (int Min, int Max) FindMinMax(int[] numbers)
    {
    }
}

/*
Answer:

// Task: Returning Tuples from Methods
// Find and return the minimum and maximum values as named tuple elements.

public class Solution
{
    public static (int Min, int Max) FindMinMax(int[] numbers)
    {
        int min = numbers[0];
        int max = numbers[0];

        foreach (int number in numbers)
        {
            if (number < min)
            {
                min = number;
            }

            if (number > max)
            {
                max = number;
            }
        }

        return (min, max);
    }
}
*/
