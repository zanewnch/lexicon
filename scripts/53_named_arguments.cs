// Exercise: Named arguments
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Call CreateProfile with different combinations of named and positional arguments.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Call CreateProfile with different combinations of named and positional arguments.
public class Solution
{
    public static string CallWithNamedArguments(int scenario)
    {
    }

    private static string CreateProfile(string name, int age, string city, bool isActive)
    {
    }
}

/*
Answer:

// Task: Named arguments
// Call CreateProfile with different combinations of named and positional arguments.

public class Solution
{
    public static string CallWithNamedArguments(int scenario)
    {
        return scenario switch
        {
            1 => CreateProfile(isActive: true, city: "Paris", age: 25, name: "Alice"),
            2 => CreateProfile("Bob", city: "London", age: 30, isActive: false),
            3 => CreateProfile("Carol", age: 22, city: "Tokyo", isActive: true),
            4 => CreateProfile("David", 40, "Berlin", false),
            _ => "Invalid scenario"
        };
    }

    private static string CreateProfile(string name, int age, string city, bool isActive)
    {
        return $"{name}, {age}, {city}, {isActive}";
    }
}
*/
