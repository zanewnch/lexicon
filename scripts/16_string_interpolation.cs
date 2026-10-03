using System;

// Exercise: String interpolation
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print the user's name, age, height, and balance using interpolated strings.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print the user's name, age, height, and balance using interpolated strings.
public class Solution
{
  public static void PrintUserProfile(string name, int age, double height, decimal balance)

  {
    Console.WriteLine($"{name} {age} {height} {balance}");
  }
}

/*
Answer:

using System;

// Task: String interpolation
// Print the user's name, age, height, and balance using interpolated strings.

public class Solution
{
    public static void PrintUserProfile(string name, int age, double height, decimal balance)
    {
        Console.WriteLine($"Name: {name}");
        Console.WriteLine($"Age: {age} years old");
        Console.WriteLine($"Height: {height}m");
        Console.WriteLine($"Balance: ${balance}");
    }
}
*/
