// Exercise: Method Overriding
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Override Animal.Speak in Dog so polymorphic calls return "Woof".
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Override Animal.Speak in Dog so polymorphic calls return "Woof".
public class Solution
{
}

/*
Answer:

// Task: Method Overriding
// Override Animal.Speak in Dog so polymorphic calls return "Woof".

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
        return "Woof";
    }
}
*/
