// Exercise: Virtual Methods
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Override a virtual Speak method for Dog and Cat, then test polymorphic calls.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Override a virtual Speak method for Dog and Cat, then test polymorphic calls.
public class Solution
{
    public static string TestAnimalSpeak(string animalType)
    {
    }
}

/*
Answer:

// Task: Virtual Methods
// Override a virtual Speak method for Dog and Cat, then test polymorphic calls.

public class Animal
{
    public virtual string Speak()
    {
        return "Some sound";
    }
}

public class Dog : Animal
{
    public override string Speak()
    {
        return "Woof!";
    }
}

public class Cat : Animal
{
    public override string Speak()
    {
        return "Meow!";
    }
}

public class Solution
{
    public static string TestAnimalSpeak(string animalType)
    {
        Animal animal = animalType switch
        {
            "dog" => new Dog(),
            "cat" => new Cat(),
            _ => new Animal()
        };

        return animal.Speak();
    }
}
*/
