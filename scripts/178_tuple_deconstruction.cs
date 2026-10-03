// Exercise: Tuple Deconstruction
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Deconstruct the supplied tuple and use its variables in a description.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Deconstruct the supplied tuple and use its variables in a description.
public class Solution
{
    public static string DeconstructPerson((string Name, int Age, string City) person)
    {
    }
}

/*
Answer:

// Task: Tuple Deconstruction
// Deconstruct the supplied tuple and use its variables in a description.

public class Solution
{
    public static string DeconstructPerson((string Name, int Age, string City) person)
    {
        (string name, int age, string city) = person;
        return $"{name} is {age} years old and lives in {city}";
    }
}
*/
