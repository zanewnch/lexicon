using System;
using System.Collections.Generic;

// Exercise: The using Statement
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use LockedResource in using blocks so the resource is released afterward.
// public sealed class LockedResource : IDisposable
// {
//     private static readonly HashSet<string> LockedNames = new HashSet<string>();
//     public LockedResource(string resourceName)
//     {
//         ResourceName = resourceName;
//         LockedNames.Add(resourceName);
//     }
//     public string ResourceName { get; }
//     public string Process(string content)
//     {
//         return $"[{ResourceName}] Processed: {content}";
//     }
//     public static bool IsAvailable(string resourceName)
//     {
//         return !LockedNames.Contains(resourceName);
//     }
//     public void Dispose()
//     {
//         LockedNames.Remove(ResourceName);
//     }
// }
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use LockedResource in using blocks so the resource is released afterward.
// public sealed class LockedResource : IDisposable
// {
//     private static readonly HashSet<string> LockedNames = new HashSet<string>();
//     public LockedResource(string resourceName)
//     {
//         ResourceName = resourceName;
//         LockedNames.Add(resourceName);
//     }
//     public string ResourceName { get; }
//     public string Process(string content)
//     {
//         return $"[{ResourceName}] Processed: {content}";
//     }
//     public static bool IsAvailable(string resourceName)
//     {
//         return !LockedNames.Contains(resourceName);
//     }
//     public void Dispose()
//     {
//         LockedNames.Remove(ResourceName);
//     }
// }
public class Solution
{
    public static bool IsAvailable(string resourceName)
    {
    }

    public static string ProcessLockedResource(string resourceName, string content)
    {
    }

    public static bool IsResourceAvailable(string resourceName)
    {
    }

    public static string ProcessThenReport(string resourceName, string content)
    {
    }
}

/*
Answer:

using System;
using System.Collections.Generic;

// Task: The using Statement
// Use LockedResource in using blocks so the resource is released afterward.

public sealed class LockedResource : IDisposable
{
    private static readonly HashSet<string> LockedNames = new HashSet<string>();

    public LockedResource(string resourceName)
    {
        ResourceName = resourceName;
        LockedNames.Add(resourceName);
    }

    public string ResourceName { get; }

    public string Process(string content)
    {
        return $"[{ResourceName}] Processed: {content}";
    }

    public static bool IsAvailable(string resourceName)
    {
        return !LockedNames.Contains(resourceName);
    }

    public void Dispose()
    {
        LockedNames.Remove(ResourceName);
    }
}

public class Solution
{
    public static string ProcessLockedResource(string resourceName, string content)
    {
        using LockedResource resource = new LockedResource(resourceName);
        return resource.Process(content);
    }

    public static bool IsResourceAvailable(string resourceName)
    {
        return LockedResource.IsAvailable(resourceName);
    }

    public static string ProcessThenReport(string resourceName, string content)
    {
        string processed;

        using (LockedResource resource = new LockedResource(resourceName))
        {
            processed = resource.Process(content);
        }

        return $"Result: {processed}, ReleasedAfterUse: {IsResourceAvailable(resourceName)}";
    }
}
*/
