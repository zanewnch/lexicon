// Exercise: Static Fields
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Track Player instances with a private static counter and expose reset/count methods.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Track Player instances with a private static counter and expose reset/count methods.
public class Solution
{
    public static int GetCount()
    {
    }

    public static void ResetCount()
    {
    }

    public static int GetInstanceCount()
    {
    }

    public static int CreatePlayers(int count)
    {
    }
}

/*
Answer:

// Task: Static Fields
// Track Player instances with a private static counter and expose reset/count methods.

public class Player
{
    private static int _count;

    public Player(string name)
    {
        Name = name;
        _count++;
    }

    public string Name { get; }

    public static int GetCount()
    {
        return _count;
    }

    public static void ResetCount()
    {
        _count = 0;
    }
}

public class Solution
{
    public static int GetInstanceCount()
    {
        Player.ResetCount();
        _ = new Player("Alice");
        _ = new Player("Bob");
        _ = new Player("Charlie");
        return Player.GetCount();
    }

    public static int CreatePlayers(int count)
    {
        Player.ResetCount();

        for (int index = 0; index < count; index++)
        {
            _ = new Player($"Player {index + 1}");
        }

        return Player.GetCount();
    }
}
*/
