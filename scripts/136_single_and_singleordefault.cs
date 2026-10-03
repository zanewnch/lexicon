using System.Collections.Generic;
using System.Linq;

// Exercise: Single and SingleOrDefault
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Find a user by unique email and return the username or "Not Found".
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Find a user by unique email and return the username or "Not Found".
public class Solution
{
    public static string FindUserByEmail(List<User> users, string email)
    {
    }
}

/*
Answer:

using System.Collections.Generic;
using System.Linq;

// Task: Single and SingleOrDefault
// Find a user by unique email and return the username or "Not Found".

public class User
{
    public User(string username, string email)
    {
        Username = username;
        Email = email;
    }

    public string Username { get; }
    public string Email { get; }
}

public class Solution
{
    public static string FindUserByEmail(List<User> users, string email)
    {
        User? user = users.SingleOrDefault(user => user.Email == email);
        return user?.Username ?? "Not Found";
    }
}
*/
