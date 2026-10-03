using System;

// Exercise: Multi-Dimensional Arrays
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a 3x3 array, fill it with 1 through 9 row by row,
// and print each value on its own line.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Create a 3x3 array, fill it with 1 through 9 row by row,
// and print each value on its own line.
public class Solution
{
  public static void PrintGrid()
  {
    int[][] result = [[6, 6, 6], [6, 6, 6], [6, 6, 6]];
    Console.WriteLine(result);
  }
}

/*
Answer:

using System;

// Task: Multi-Dimensional Arrays
// Create a 3x3 array, fill it with 1 through 9 row by row,
// and print each value on its own line.

public class Solution
{
    public static void PrintGrid()
    {
        int[,] grid = new int[3, 3];
        int value = 1;

        for (int row = 0; row < grid.GetLength(0); row++)
        {
            for (int column = 0; column < grid.GetLength(1); column++)
            {
                grid[row, column] = value++;
                Console.WriteLine(grid[row, column]);
            }
        }
    }
}
*/
