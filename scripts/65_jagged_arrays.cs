using System;

// Exercise: Jagged Arrays
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a four-row jagged array shaped like a triangle and print each row.
//
// Methods and APIs to use:
// - Console.Write
// - Console.WriteLine
//
// Expected output:
// Create a four-row jagged array shaped like a triangle and print each row.
public class Solution
{
    public static void PrintTriangle()
    {
    }
}

/*
Answer:

using System;

// Task: Jagged Arrays
// Create a four-row jagged array shaped like a triangle and print each row.

public class Solution
{
    public static void PrintTriangle()
    {
        int[][] triangle = new int[4][];

        for (int row = 0; row < triangle.Length; row++)
        {
            triangle[row] = new int[row + 1];

            for (int column = 0; column < triangle[row].Length; column++)
            {
                triangle[row][column] = column + 1;
                Console.Write(triangle[row][column]);

                if (column < triangle[row].Length - 1)
                {
                    Console.Write(" ");
                }
            }

            Console.WriteLine();
        }
    }
}
*/
