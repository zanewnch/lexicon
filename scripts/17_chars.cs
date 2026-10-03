using System;

// Exercise: Chars
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print the character, whether it is a letter, whether it is a digit,
// and whether it is uppercase.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print the character, whether it is a letter, whether it is a digit,
// and whether it is uppercase.
public class Solution
{
  public static void PrintCharInfo(char c)
  {
    Console.WriteLine(c);
    Console.WriteLine(char.IsLetter(c));
    Console.WriteLine(char.IsDigit(c));
  }
}

/*
Answer:

using System;

// Task: Chars
// Print the character, whether it is a letter, whether it is a digit,
// and whether it is uppercase.

public class Solution
{
    public static void PrintCharInfo(char c)
    {
        Console.WriteLine(c);
        Console.WriteLine(char.IsLetter(c));
        Console.WriteLine(char.IsDigit(c));
        Console.WriteLine(char.IsUpper(c));
    }
}
*/
