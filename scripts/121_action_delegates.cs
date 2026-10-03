using System;
using System.Collections.Generic;

// Exercise: Action Delegates
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Invoke the supplied Action for every message and return all logged messages.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Invoke the supplied Action for every message and return all logged messages.
public class Solution
{
    public static string ExecuteActions(string[] messages, Action<string, List<string>> logger)
    {
    }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: Action Delegates
// Invoke the supplied Action for every message and return all logged messages.

public class Solution
{
    public static string ExecuteActions(string[] messages, Action<string, List<string>> logger)
    {
        List<string> loggedMessages = new List<string>();

        foreach (string message in messages)
        {
            logger(message, loggedMessages);
        }

        return string.Join(Environment.NewLine, loggedMessages);
    }
}
*/
