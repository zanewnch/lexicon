// Exercise: StartsWith and EndsWith
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Check whether a filename ends with .txt and a URL starts with https://.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Check whether a filename ends with .txt and a URL starts with https://.
public class Solution
{
    public static bool IsTextFile(string filename)
    {
    }

    public static bool IsHttpsUrl(string url)
    {
    }
}

/*
Answer:

// Task: StartsWith and EndsWith
// Check whether a filename ends with .txt and a URL starts with https://.

public class Solution
{
    public static bool IsTextFile(string filename)
    {
        return filename.EndsWith(".txt");
    }

    public static bool IsHttpsUrl(string url)
    {
        return url.StartsWith("https://");
    }
}
*/
