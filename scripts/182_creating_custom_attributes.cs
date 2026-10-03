using System;
using System.Reflection;

// Exercise: Creating Custom Attributes
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Define AuthorAttribute, apply it to the sample classes, and read its values.
// [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Define AuthorAttribute, apply it to the sample classes, and read its values.
// [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class Solution
{
    public static string GetAuthorInfo(Type type)
    {
    }
}

/*
Answer:

using System;
using System.Reflection;

// Task: Creating Custom Attributes
// Define AuthorAttribute, apply it to the sample classes, and read its values.

[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class AuthorAttribute : Attribute
{
    public AuthorAttribute(string name)
    {
        Name = name;
    }

    public string Name { get; }
    public string Version { get; set; } = "1.0";
}

[Author("John Smith", Version = "2.0")]
public class Calculator
{
}

[Author("Jane Doe")]
public class StringHelper
{
}

public class Solution
{
    public static string GetAuthorInfo(Type type)
    {
        AuthorAttribute? author = type.GetCustomAttribute<AuthorAttribute>();
        return author is null
            ? "No author information"
            : $"Author: {author.Name}, Version: {author.Version}";
    }
}
*/
