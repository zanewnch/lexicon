// Exercise: Private Access Modifier
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Protect a bank account balance with a private field and public operations.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Protect a bank account balance with a private field and public operations.
public class Solution
{
    public static string TestBankAccount(double initialDeposit, double withdrawAmount)
    {
    }
}

/*
Answer:

// Task: Private Access Modifier
// Protect a bank account balance with a private field and public operations.

public class BankAccount
{
    private double _balance;

    public BankAccount(double initialDeposit)
    {
        _balance = initialDeposit;
    }

    public double GetBalance()
    {
        return _balance;
    }

    public void Deposit(double amount)
    {
        _balance += amount;
    }

    public bool Withdraw(double amount)
    {
        if (amount > _balance)
        {
            return false;
        }

        _balance -= amount;
        return true;
    }
}

public class Solution
{
    public static string TestBankAccount(double initialDeposit, double withdrawAmount)
    {
        BankAccount account = new BankAccount(initialDeposit);
        bool succeeded = account.Withdraw(withdrawAmount);
        string result = succeeded ? "Success" : "Failed";
        return $"Balance: {account.GetBalance():F2}, Withdrawal: {result}";
    }
}
*/
