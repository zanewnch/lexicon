using System.Text;

// Exercise: StringBuilder
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Build a title, matching dash line, and numbered items without trailing newlines.
//
// Methods and APIs to use:
// - StringBuilder
//
// Expected output:
// Build a title, matching dash line, and numbered items without trailing newlines.
public class Solution
{
    public static string BuildReport(string title, string[] items)
    {
    }
}

/*
Answer:

using System.Text;

// Task: StringBuilder
// Build a title, matching dash line, and numbered items without trailing newlines.

public class Solution
{
    public static string BuildReport(string title, string[] items)
    {
        StringBuilder report = new StringBuilder();
        report.AppendLine(title);
        report.AppendLine(new string('-', title.Length));

        for (int index = 0; index < items.Length; index++)
        {
            report.Append(index + 1);
            report.Append(". ");
            report.AppendLine(items[index]);
        }

        return report.ToString().TrimEnd('\r', '\n');
    }
}
*/
