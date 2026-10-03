// Exercise: Booleans
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// A person is eligible to vote only when they are an adult and a citizen.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// A person is eligible to vote only when they are an adult and a citizen.
public class Solution
{
  public static bool IsEligibleToVote(bool isAdult, bool isCitizen)
  {
    return isAdult && isCitizen;
  }
}

/*
Answer:

// Task: Booleans
// A person is eligible to vote only when they are an adult and a citizen.

public class Solution
{
    public static bool IsEligibleToVote(bool isAdult, bool isCitizen)
    {
        return isAdult && isCitizen;
    }
}
*/
