using System;
using System.Runtime.InteropServices;

// Exercise: Decimals
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Add price1 and price2 with decimal.Add() and return the total.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Add price1 and price2 with decimal.Add() and return the total.
public class Solution
{
  public static decimal AddPrices(decimal price1, decimal price2)
  {
    return price1 + price2;
  }
}

/*
Answer:

using System;

// Task: Decimals
// Add price1 and price2 with decimal.Add() and return the total.

public class Solution
{
    public static decimal AddPrices(decimal price1, decimal price2)
    {
        return decimal.Add(price1, price2);
    }
}
*/
