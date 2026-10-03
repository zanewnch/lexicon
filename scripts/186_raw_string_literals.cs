// Exercise: Raw String Literals
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a JSON object using a raw string literal with interpolation.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a JSON object using a raw string literal with interpolation.
public class Solution
{
    public static string CreatePersonJson(string name, int age, string city)
    {
    }
}

/*
Answer:

// Task: Raw String Literals
// Return a JSON object using a raw string literal with interpolation.

public class Solution
{
    public static string CreatePersonJson(string name, int age, string city)
    {
        return $$"""
{
    "name": "{{name}}",
    "age": {{age}},
    "city": "{{city}}"
}
""";
    }
}
*/
