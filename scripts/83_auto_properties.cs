// Exercise: Auto-Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use auto-properties for Name, Age, and Email, then return the profile info.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use auto-properties for Name, Age, and Email, then return the profile info.
public class Solution
{
  public string testResult { get; set; } = "Test";
  public static string GetPersonInfo(string name, int age)
  {
  }
}

/*
Answer:

// Task: Auto-Properties
// Use auto-properties for Name, Age, and Email, then return the profile info.

public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
        Email = "test@example.com";
    }
}

public class Solution
{
    public static string GetPersonInfo(string name, int age)
    {
        Person person = new Person(name, age);
        return $"{person.Name}, {person.Age}, {person.Email}";
    }
}
*/
