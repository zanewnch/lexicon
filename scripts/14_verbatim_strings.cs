using System;

// Exercise: Verbatim Strings
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Print these Windows paths with verbatim string literals:
// C:\Users\Admin\Documents\report.txt
// D:\Mail\Inbox\2026\archive.pst
//
// Methods and APIs to use:
// - Console.WriteLine
//
// Expected output:
// Print these Windows paths with verbatim string literals:
// C:\Users\Admin\Documents\report.txt
// D:\Mail\Inbox\2026\archive.pst
public class Solution
{
  public static void PrintFilePaths()
  {
    Console.WriteLine(@"C:\Users\Admin\Documents\report.txt");
    Console.WriteLine(@"D:\Mail\Inbox\2026\archive.pst");
  }
}

/*
Answer:

using System;

// Task: Verbatim Strings
// Print these Windows paths with verbatim string literals:
// C:\Users\Admin\Documents\report.txt
// D:\Mail\Inbox\2026\archive.pst

public class Solution
{
    public static void PrintFilePaths()
    {
        Console.WriteLine(@"C:\Users\Admin\Documents\report.txt");
        Console.WriteLine(@"D:\Mail\Inbox\2026\archive.pst");
    }
}
*/
