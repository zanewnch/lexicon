// Exercise: Private Set Properties
//
// What you need to do:
// Follow the requirements below and keep the supplied public API unchanged.
// Create a bank account whose properties are publicly readable but privately set.
// Deposits increase the balance; withdrawals fail when funds are insufficient.
//
// Methods and APIs to use:
// - The C# language feature named by this exercise.
//
// Expected output:
// Create a bank account whose properties are publicly readable but privately set.
// Deposits increase the balance; withdrawals fail when funds are insufficient.
public class Solution
{
  public string result { get; private set; }
  public static string GetBankAccountInfo(string accountHolder, decimal initialDeposit)
  {
  }

  public static decimal DepositAndGetBalance(string accountHolder, decimal initialDeposit, decimal amount)
  {
  }

  public static decimal WithdrawAndGetBalance(string accountHolder, decimal initialDeposit, decimal amount)
  {
  }
}

/*
Answer:

// Task: Private Set Properties
// Create a bank account whose properties are publicly readable but privately set.
// Deposits increase the balance; withdrawals fail when funds are insufficient.

public class BankAccount
{
    public BankAccount(string accountHolder, decimal initialDeposit)
    {
        AccountHolder = accountHolder;
        Balance = initialDeposit;
    }

    public string AccountHolder { get; private set; }
    public decimal Balance { get; private set; }

    public decimal Deposit(decimal amount)
    {
        Balance += amount;
        return Balance;
    }

    public decimal Withdraw(decimal amount)
    {
        if (amount > Balance)
        {
            return -1;
        }

        Balance -= amount;
        return Balance;
    }
}

public class Solution
{
    public static string GetBankAccountInfo(string accountHolder, decimal initialDeposit)
    {
        BankAccount account = new BankAccount(accountHolder, initialDeposit);
        return $"{account.AccountHolder}: {account.Balance:F2}";
    }

    public static decimal DepositAndGetBalance(string accountHolder, decimal initialDeposit, decimal amount)
    {
        BankAccount account = new BankAccount(accountHolder, initialDeposit);
        return account.Deposit(amount);
    }

    public static decimal WithdrawAndGetBalance(string accountHolder, decimal initialDeposit, decimal amount)
    {
        BankAccount account = new BankAccount(accountHolder, initialDeposit);
        return account.Withdraw(amount);
    }
}
*/
