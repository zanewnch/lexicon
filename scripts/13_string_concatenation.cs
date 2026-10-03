using System;

// Exercise: String concatenation
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print a full name, a greeting, and an age message by concatenating strings.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print a full name, a greeting, and an age message by concatenating strings.
public class Solution
{
  public static void PrintConcatenation(string firstName, string lastName, int age)
  {
    string fullName = $"{firstName} {lastName}";
    string result = $"{fullName} with age {age}";
    Console.WriteLine(result);
  }
}

/*
Answer:

using System;

// Task: String concatenation
// Print a full name, a greeting, and an age message by concatenating strings.

public class Solution
{
    public static void PrintConcatenation(string firstName, string lastName, int age)
    {
        string fullName = firstName + " " + lastName;

        Console.WriteLine(fullName);
        Console.WriteLine("Hello, " + fullName + "!");
        Console.WriteLine(fullName + " is " + age + " years old.");
    }
}
*/
