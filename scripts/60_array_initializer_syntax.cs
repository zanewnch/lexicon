using System;

// Exercise: Array Initializer Syntax
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print the first and last elements of the supplied integer array.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print the first and last elements of the supplied integer array.
public class Solution
{
  public static void PrintFirstAndLast(int[] numbers)
  {
    int[] result = new int[] { value };
    result = numbers;
    Console.WriteLine(result[0], result[^1]);
  }
}

/*
Answer:

using System;

// Task: Array Initializer Syntax
// Print the first and last elements of the supplied integer array.

public class Solution
{
    public static void PrintFirstAndLast(int[] numbers)
    {
        Console.WriteLine(numbers[0]);
        Console.WriteLine(numbers[^1]);
    }
}
*/
