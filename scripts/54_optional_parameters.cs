// Exercise: Optional parameters
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Return a greeting using a required name and an optional Hello prefix.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Return a greeting using a required name and an optional Hello prefix.
public class Solution
{
  public static string Greet(string name, string prefix = "Hello")
  {
    string result = $"{name} {prefix}";
    return result;
  }

  public string method1(string name, string age = 23)
  {
    return $"{name} {age}";
  }
}

/*
Answer:

// Task: Optional parameters
// Return a greeting using a required name and an optional Hello prefix.

public class Solution
{
    public static string Greet(string name, string prefix = "Hello")
    {
        return $"{prefix}, {name}!";
    }
}
*/
