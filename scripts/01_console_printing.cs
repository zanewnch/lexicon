using System;

// Exercise: Console Printing
//
// What you need to do:
// Two string variables are provided: name and favoriteColor.
// Use the Console.WriteLine() method to:
// 1. Print the value of name on its own line.
// 2. Print the value of favoriteColor on the following line.
//
// Method to use:
// Console.WriteLine(value)
//
// Console.WriteLine() writes the supplied value to the console and then
// moves the cursor to the next line. Call it once for each required line.
// Do not combine both values into one line, and do not print extra text.
//
// Expected output:
// Alex
// Blue

public class Solution
{
    public static void PrintNameAndColor()
    {
        string name = "Alex";
        string favoriteColor = "Blue";

        Console.WriteLine(name);
        Console.WriteLine(favoriteColor);
    }
}

/*
Answer:

using System;

public class Solution
{
    public static void PrintNameAndColor()
    {
        string name = "Alex";
        string favoriteColor = "Blue";

        Console.WriteLine(name);
        Console.WriteLine(favoriteColor);
    }
}
*/
