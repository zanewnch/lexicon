using System;
using System.Collections.Generic;

// Exercise: Adding to Lists
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create an empty string list, add three fruits with Add(), and print them.
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Create an empty string list, add three fruits with Add(), and print them.
public class Solution
{
  public static void AddItemsToList()
  {
    List<string> items = new List<string>();
    items.Add("Apple");
    items.Add("Banana");
    items.Add("Mango");
    Console.WriteLine(items);
  }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: Adding to Lists
// Create an empty string list, add three fruits with Add(), and print them.

public class Solution
{
    public static void AddItemsToList()
    {
        List<string> fruits = new List<string>();
        fruits.Add("Apple");
        fruits.Add("Banana");
        fruits.Add("Cherry");

        foreach (string fruit in fruits)
        {
            Console.WriteLine(fruit);
        }
    }
}
*/
