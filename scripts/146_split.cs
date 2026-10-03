using System;

// Exercise: Split
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Split a sentence by spaces and print each resulting word on its own line.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Split a sentence by spaces and print each resulting word on its own line.
public class Solution
{
    public static void PrintWords(string sentence)
    {
    }
}

/*
Answer:

using System;

// Task: Split
// Split a sentence by spaces and print each resulting word on its own line.

public class Solution
{
    public static void PrintWords(string sentence)
    {
        string[] words = sentence.Split(' ');

        foreach (string word in words)
        {
            Console.WriteLine(word);
        }
    }
}
*/
