using System;

// Exercise: Custom Exception Messages
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Validate that age is between 0 and 150 and include the received value
// in any ArgumentException message.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Validate that age is between 0 and 150 and include the received value
// in any ArgumentException message.
public class Solution
{
    public static void ValidateAge(int age)
    {
    }
}

/*
Answer:

using System;

// Task: Custom Exception Messages
// Validate that age is between 0 and 150 and include the received value
// in any ArgumentException message.

public class Solution
{
    public static void ValidateAge(int age)
    {
        if (age < 0)
        {
            throw new ArgumentException($"Age cannot be negative. Received: {age}");
        }

        if (age > 150)
        {
            throw new ArgumentException($"Age cannot exceed 150. Received: {age}");
        }
    }
}
*/
