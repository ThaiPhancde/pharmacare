const db = require('../config/db');

class Invoice {
  constructor(id, invoice_id, customer_id, total_amount, discount, paid_amount, due_amount, invoice_date) {
    this.id = id;
    this.invoice_id = invoice_id;
    this.customer_id = customer_id;
    this.total_amount = total_amount;
    this.discount = discount;
    this.paid_amount = paid_amount;
    this.due_amount = due_amount;
    this.invoice_date = invoice_date;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM invoices WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const invoice = rows[0];
      return new Invoice(
        invoice.id,
        invoice.invoice_id,
        invoice.customer_id,
        invoice.total_amount,
        invoice.discount,
        invoice.paid_amount,
        invoice.due_amount,
        invoice.invoice_date
      );
    } catch (error) {
      console.error('Error finding invoice by ID:', error);
      throw error;
    }
  }

  static async findByInvoiceId(invoice_id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM invoices WHERE invoice_id = ?',
        [invoice_id]
      );
      if (rows.length === 0) {
        return null;
      }
      const invoice = rows[0];
      return new Invoice(
        invoice.id,
        invoice.invoice_id,
        invoice.customer_id,
        invoice.total_amount,
        invoice.discount,
        invoice.paid_amount,
        invoice.due_amount,
        invoice.invoice_date
      );
    } catch (error) {
      console.error('Error finding invoice by invoice ID:', error);
      throw error;
    }
  }

  static async generateInvoiceId() {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM invoices WHERE invoice_id LIKE ?',
        [`INV-${year}${month}${day}%`]
      );
      
      const count = rows[0].count + 1;
      return `INV-${year}${month}${day}-${count.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice ID:', error);
      throw error;
    }
  }

  static async create(invoice_id, customer_id, total_amount, discount = 0, paid_amount = 0, due_amount = 0, invoice_date = new Date().toISOString().split('T')[0]) {
    try {
      const [result] = await db.execute(
        'INSERT INTO invoices (invoice_id, customer_id, total_amount, discount, paid_amount, due_amount, invoice_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [invoice_id, customer_id, total_amount, discount, paid_amount, due_amount, invoice_date]
      );
      
      return new Invoice(
        result.insertId,
        invoice_id,
        customer_id,
        total_amount,
        discount,
        paid_amount,
        due_amount,
        invoice_date
      );
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async update(id, customer_id, total_amount, discount, paid_amount, due_amount, invoice_date) {
    try {
      await db.execute(
        'UPDATE invoices SET customer_id = ?, total_amount = ?, discount = ?, paid_amount = ?, due_amount = ?, invoice_date = ? WHERE id = ?',
        [customer_id, total_amount, discount, paid_amount, due_amount, invoice_date, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM invoices WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM invoices ORDER BY created_at DESC');
      
      return rows.map(
        invoice => new Invoice(
          invoice.id,
          invoice.invoice_id,
          invoice.customer_id,
          invoice.total_amount,
          invoice.discount,
          invoice.paid_amount,
          invoice.due_amount,
          invoice.invoice_date
        )
      );
    } catch (error) {
      console.error('Error getting all invoices:', error);
      throw error;
    }
  }

  static async addInvoiceDetails(invoice_id, medicine_id, quantity, unit_price, total_price) {
    try {
      const [result] = await db.execute(
        'INSERT INTO invoice_details (invoice_id, medicine_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [invoice_id, medicine_id, quantity, unit_price, total_price]
      );
      
      // Cập nhật số lượng trong kho
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [quantity, medicine_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding invoice details:', error);
      throw error;
    }
  }

  static async getInvoiceDetails(invoice_id) {
    try {
      const [rows] = await db.execute(`
        SELECT id.*, m.name as medicine_name, m.generic_name
        FROM invoice_details id
        JOIN medicines m ON id.medicine_id = m.id
        WHERE id.invoice_id = ?
      `, [invoice_id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting invoice details:', error);
      throw error;
    }
  }

  static async getInvoiceWithDetails(id) {
    try {
      const [invoiceRows] = await db.execute(`
        SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
      `, [id]);
      
      if (invoiceRows.length === 0) {
        return null;
      }
      
      const invoice = invoiceRows[0];
      
      const [detailRows] = await db.execute(`
        SELECT id.*, m.name as medicine_name, m.generic_name
        FROM invoice_details id
        JOIN medicines m ON id.medicine_id = m.id
        WHERE id.invoice_id = ?
      `, [invoice.id]);
      
      return {
        ...invoice,
        details: detailRows
      };
    } catch (error) {
      console.error('Error getting invoice with details:', error);
      throw error;
    }
  }
}

module.exports = Invoice; 