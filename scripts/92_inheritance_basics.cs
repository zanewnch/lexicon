// Exercise: Inheritance Basics
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create Dog as an Animal subclass and pass name and age to the base constructor.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create Dog as an Animal subclass and pass name and age to the base constructor.
public class Solution
{
    public static string MakeDogSpeak(string name, int age)
    {
    }

    public static string GetDogInfo(string name, int age)
    {
    }
}

/*
Answer:

// Task: Inheritance Basics
// Create Dog as an Animal subclass and pass name and age to the base constructor.

public class Animal
{
    public Animal(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public string Name { get; }
    public int Age { get; }
}

public class Dog : Animal
{
    public Dog(string name, int age) : base(name, age)
    {
    }

    public string Speak()
    {
        return $"Woof! My name is {Name}";
    }
}

public class Solution
{
    public static string MakeDogSpeak(string name, int age)
    {
        return new Dog(name, age).Speak();
    }

    public static string GetDogInfo(string name, int age)
    {
        Dog dog = new Dog(name, age);
        return $"{dog.Name} is {dog.Age} years old";
    }
}
*/
