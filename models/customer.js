const db = require('../config/db');

class Customer {
  constructor(id, name, email, phone, address) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.address = address;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const customer = rows[0];
      return new Customer(
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.address
      );
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      throw error;
    }
  }

  static async create(name, email, phone, address) {
    try {
      const [result] = await db.execute(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [name, email, phone, address]
      );
      
      return new Customer(
        result.insertId,
        name,
        email,
        phone,
        address
      );
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  static async update(id, name, email, phone, address) {
    try {
      await db.execute(
        'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
        [name, email, phone, address, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM customers WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM customers');
      
      return rows.map(
        customer => new Customer(
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address
        )
      );
    } catch (error) {
      console.error('Error getting all customers:', error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      
      return rows.map(
        customer => new Customer(
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address
        )
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  static async getTotalCount() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM customers');
      return rows[0].count;
    } catch (error) {
      console.error('Error getting total customer count:', error);
      throw error;
    }
  }
}

module.exports = Customer; 