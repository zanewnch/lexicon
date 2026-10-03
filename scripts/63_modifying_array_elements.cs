using System;

// Exercise: Modifying Array Elements
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Change the element at index 1 to 99, then print the whole array.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Change the element at index 1 to 99, then print the whole array.
public class Solution
{
  public static void ModifyAndPrint(int[] numbers)
  {
    numbers[1] = 99;
  }
}

/*
Answer:

using System;

// Task: Modifying Array Elements
// Change the element at index 1 to 99, then print the whole array.

public class Solution
{
    public static void ModifyAndPrint(int[] numbers)
    {
        numbers[1] = 99;

        foreach (int number in numbers)
        {
            Console.WriteLine(number);
        }
    }
}
*/
