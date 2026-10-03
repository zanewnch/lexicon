// Exercise: Value Type Behavior
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Copy a Player struct, damage the copy, and return the unchanged original health.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Copy a Player struct, damage the copy, and return the unchanged original health.
public class Solution
{
    public static int GetOriginalHealthAfterModifyingCopy(int initialHealth, int damageToApply)
    {
    }
}

/*
Answer:

// Task: Value Type Behavior
// Copy a Player struct, damage the copy, and return the unchanged original health.

public struct Player
{
    public Player(int health)
    {
        Health = health;
    }

    public int Health { get; private set; }

    public void ApplyDamage(int damage)
    {
        Health -= damage;
    }
}

public class Solution
{
    public static int GetOriginalHealthAfterModifyingCopy(int initialHealth, int damageToApply)
    {
        Player original = new Player(initialHealth);
        Player copy = original;
        copy.ApplyDamage(damageToApply);

        return original.Health;
    }
}
*/
