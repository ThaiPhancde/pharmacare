const db = require('../config/db');

class BankAccount {
  constructor(id, account_name, account_number, bank_name, branch, balance) {
    this.id = id;
    this.account_name = account_name;
    this.account_number = account_number;
    this.bank_name = bank_name;
    this.branch = branch;
    this.balance = balance;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM bank_accounts WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const account = rows[0];
      return new BankAccount(
        account.id,
        account.account_name,
        account.account_number,
        account.bank_name,
        account.branch,
        account.balance
      );
    } catch (error) {
      console.error('Error finding bank account by ID:', error);
      throw error;
    }
  }

  static async create(account_name, account_number, bank_name, branch, balance = 0) {
    try {
      const [result] = await db.execute(
        'INSERT INTO bank_accounts (account_name, account_number, bank_name, branch, balance) VALUES (?, ?, ?, ?, ?)',
        [account_name, account_number, bank_name, branch, balance]
      );
      
      return new BankAccount(
        result.insertId,
        account_name,
        account_number,
        bank_name,
        branch,
        balance
      );
    } catch (error) {
      console.error('Error creating bank account:', error);
      throw error;
    }
  }

  static async update(id, account_name, account_number, bank_name, branch) {
    try {
      await db.execute(
        'UPDATE bank_accounts SET account_name = ?, account_number = ?, bank_name = ?, branch = ? WHERE id = ?',
        [account_name, account_number, bank_name, branch, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }

  static async updateBalance(id, amount) {
    try {
      await db.execute(
        'UPDATE bank_accounts SET balance = balance + ? WHERE id = ?',
        [amount, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating bank balance:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM bank_accounts WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM bank_accounts');
      
      return rows.map(
        account => new BankAccount(
          account.id,
          account.account_name,
          account.account_number,
          account.bank_name,
          account.branch,
          account.balance
        )
      );
    } catch (error) {
      console.error('Error getting all bank accounts:', error);
      throw error;
    }
  }
}

module.exports = BankAccount; 