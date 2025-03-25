const db = require('../config/db');

class Stock {
  constructor(id, medicine_id, batch_id, quantity, expiry_date) {
    this.id = id;
    this.medicine_id = medicine_id;
    this.batch_id = batch_id;
    this.quantity = quantity;
    this.expiry_date = expiry_date;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM stock WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const stock = rows[0];
      return new Stock(
        stock.id,
        stock.medicine_id,
        stock.batch_id,
        stock.quantity,
        stock.expiry_date
      );
    } catch (error) {
      console.error('Error finding stock by ID:', error);
      throw error;
    }
  }

  static async create(medicine_id, batch_id, quantity, expiry_date) {
    try {
      const [result] = await db.execute(
        'INSERT INTO stock (medicine_id, batch_id, quantity, expiry_date) VALUES (?, ?, ?, ?)',
        [medicine_id, batch_id, quantity, expiry_date]
      );
      
      // Cập nhật tổng số lượng trong bảng medicines
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [quantity, medicine_id]
      );
      
      return new Stock(
        result.insertId,
        medicine_id,
        batch_id,
        quantity,
        expiry_date
      );
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  static async update(id, medicine_id, batch_id, quantity, expiry_date) {
    try {
      // Lấy thông tin cũ trước khi cập nhật
      const [oldStockRows] = await db.execute(
        'SELECT * FROM stock WHERE id = ?',
        [id]
      );
      
      if (oldStockRows.length === 0) {
        throw new Error('Stock not found');
      }
      
      const oldStock = oldStockRows[0];
      const quantityDifference = quantity - oldStock.quantity;
      
      // Cập nhật stock
      await db.execute(
        'UPDATE stock SET medicine_id = ?, batch_id = ?, quantity = ?, expiry_date = ? WHERE id = ?',
        [medicine_id, batch_id, quantity, expiry_date, id]
      );
      
      // Cập nhật tổng số lượng trong bảng medicines
      if (quantityDifference !== 0) {
        await db.execute(
          'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [quantityDifference, medicine_id]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Lấy thông tin cũ trước khi xóa
      const [oldStockRows] = await db.execute(
        'SELECT * FROM stock WHERE id = ?',
        [id]
      );
      
      if (oldStockRows.length === 0) {
        throw new Error('Stock not found');
      }
      
      const oldStock = oldStockRows[0];
      
      // Xóa stock
      await db.execute('DELETE FROM stock WHERE id = ?', [id]);
      
      // Cập nhật tổng số lượng trong bảng medicines
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [oldStock.quantity, oldStock.medicine_id]
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting stock:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute(`
        SELECT s.*, m.name as medicine_name, m.generic_name
        FROM stock s
        JOIN medicines m ON s.medicine_id = m.id
        ORDER BY s.expiry_date ASC
      `);
      
      return rows;
    } catch (error) {
      console.error('Error getting all stock:', error);
      throw error;
    }
  }

  static async getStockByMedicineId(medicine_id) {
    try {
      const [rows] = await db.execute(`
        SELECT s.*, m.name as medicine_name, m.generic_name
        FROM stock s
        JOIN medicines m ON s.medicine_id = m.id
        WHERE s.medicine_id = ?
        ORDER BY s.expiry_date ASC
      `, [medicine_id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting stock by medicine ID:', error);
      throw error;
    }
  }

  static async getExpiredStock() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [rows] = await db.execute(`
        SELECT s.*, m.name as medicine_name, m.generic_name
        FROM stock s
        JOIN medicines m ON s.medicine_id = m.id
        WHERE s.expiry_date < ? AND s.quantity > 0
        ORDER BY s.expiry_date ASC
      `, [today]);
      
      return rows;
    } catch (error) {
      console.error('Error getting expired stock:', error);
      throw error;
    }
  }

  static async getLowStock(threshold = 10) {
    try {
      const [rows] = await db.execute(`
        SELECT m.id, m.name, m.generic_name, m.stock_quantity
        FROM medicines m
        WHERE m.stock_quantity <= ?
        ORDER BY m.stock_quantity ASC
      `, [threshold]);
      
      return rows;
    } catch (error) {
      console.error('Error getting low stock:', error);
      throw error;
    }
  }
}

module.exports = Stock; 