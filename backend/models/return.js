const db = require('../config/db');

class Return {
  constructor(id, return_id, invoice_id, customer_id, total_amount, return_date, reason) {
    this.id = id;
    this.return_id = return_id;
    this.invoice_id = invoice_id;
    this.customer_id = customer_id;
    this.total_amount = total_amount;
    this.return_date = return_date;
    this.reason = reason;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM returns WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const returnData = rows[0];
      return new Return(
        returnData.id,
        returnData.return_id,
        returnData.invoice_id,
        returnData.customer_id,
        returnData.total_amount,
        returnData.return_date,
        returnData.reason
      );
    } catch (error) {
      console.error('Error finding return by ID:', error);
      throw error;
    }
  }

  static async generateReturnId() {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM returns WHERE return_id LIKE ?',
        [`RET-${year}${month}${day}%`]
      );
      
      const count = rows[0].count + 1;
      return `RET-${year}${month}${day}-${count.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating return ID:', error);
      throw error;
    }
  }

  static async create(return_id, invoice_id, customer_id, total_amount, return_date = new Date().toISOString().split('T')[0], reason = '') {
    try {
      const [result] = await db.execute(
        'INSERT INTO returns (return_id, invoice_id, customer_id, total_amount, return_date, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [return_id, invoice_id, customer_id, total_amount, return_date, reason]
      );
      
      return new Return(
        result.insertId,
        return_id,
        invoice_id,
        customer_id,
        total_amount,
        return_date,
        reason
      );
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  }

  static async addReturnDetails(return_id, medicine_id, quantity, unit_price, total_price) {
    try {
      const [result] = await db.execute(
        'INSERT INTO return_details (return_id, medicine_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [return_id, medicine_id, quantity, unit_price, total_price]
      );
      
      // Cập nhật số lượng trong kho
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [quantity, medicine_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding return details:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM returns ORDER BY created_at DESC');
      
      return rows.map(
        returnData => new Return(
          returnData.id,
          returnData.return_id,
          returnData.invoice_id,
          returnData.customer_id,
          returnData.total_amount,
          returnData.return_date,
          returnData.reason
        )
      );
    } catch (error) {
      console.error('Error getting all returns:', error);
      throw error;
    }
  }

  static async getReturnDetails(return_id) {
    try {
      const [rows] = await db.execute(`
        SELECT rd.*, m.name as medicine_name, m.generic_name
        FROM return_details rd
        JOIN medicines m ON rd.medicine_id = m.id
        WHERE rd.return_id = ?
      `, [return_id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting return details:', error);
      throw error;
    }
  }

  static async getReturnWithDetails(id) {
    try {
      const [returnRows] = await db.execute(`
        SELECT r.*, c.name as customer_name, i.invoice_id as original_invoice_id
        FROM returns r
        LEFT JOIN customers c ON r.customer_id = c.id
        LEFT JOIN invoices i ON r.invoice_id = i.id
        WHERE r.id = ?
      `, [id]);
      
      if (returnRows.length === 0) {
        return null;
      }
      
      const returnData = returnRows[0];
      
      const [detailRows] = await db.execute(`
        SELECT rd.*, m.name as medicine_name, m.generic_name
        FROM return_details rd
        JOIN medicines m ON rd.medicine_id = m.id
        WHERE rd.return_id = ?
      `, [returnData.id]);
      
      return {
        ...returnData,
        details: detailRows
      };
    } catch (error) {
      console.error('Error getting return with details:', error);
      throw error;
    }
  }
}

module.exports = Return; 