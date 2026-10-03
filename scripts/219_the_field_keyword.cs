using System;

// Exercise: The field Keyword
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Use the field keyword in the Email property to validate and store a
// non-empty email address that contains '@'.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Use the field keyword in the Email property to validate and store a
// non-empty email address that contains '@'.
public class Solution
{
    public static string ValidateAndGetEmail(string email)
    {
    }
}

/*
Answer:

using System;

// Task: The field Keyword
// Use the field keyword in the Email property to validate and store a
// non-empty email address that contains '@'.

public class EmailValidator
{
    public string Email
    {
        get => field;
        set
        {
            if (string.IsNullOrEmpty(value) || !value.Contains('@'))
            {
                throw new ArgumentException("Invalid email format");
            }

            field = value;
        }
    }
}

public class Solution
{
    public static string ValidateAndGetEmail(string email)
    {
        EmailValidator validator = new() { Email = email };
        return validator.Email;
    }
}
*/
