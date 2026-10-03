using System;

// Exercise: Do-While Loops
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use a do-while loop to display the menu exactly three times.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Use a do-while loop to display the menu exactly three times.
public class Solution
{
    public static void DisplayMenu()
    {
    }
}

/*
Answer:

using System;

// Task: Do-While Loops
// Use a do-while loop to display the menu exactly three times.

public class Solution
{
    public static void DisplayMenu()
    {
        int iteration = 1;

        do
        {
            Console.WriteLine("=== MENU ===");
            Console.WriteLine("1. Exit");
            Console.WriteLine("2. Say Hello");
            Console.WriteLine("3. Say Goodbye");
            Console.WriteLine($"Iteration: {iteration}");
            iteration++;
        }
        while (iteration <= 3);
    }
}
*/
