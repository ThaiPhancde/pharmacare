const db = require('../config/db');

class Purchase {
  constructor(id, invoice_id, supplier_id, total_amount, discount, paid_amount, due_amount, purchase_date) {
    this.id = id;
    this.invoice_id = invoice_id;
    this.supplier_id = supplier_id;
    this.total_amount = total_amount;
    this.discount = discount;
    this.paid_amount = paid_amount;
    this.due_amount = due_amount;
    this.purchase_date = purchase_date;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM purchases WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const purchase = rows[0];
      return new Purchase(
        purchase.id,
        purchase.invoice_id,
        purchase.supplier_id,
        purchase.total_amount,
        purchase.discount,
        purchase.paid_amount,
        purchase.due_amount,
        purchase.purchase_date
      );
    } catch (error) {
      console.error('Error finding purchase by ID:', error);
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
        'SELECT COUNT(*) as count FROM purchases WHERE invoice_id LIKE ?',
        [`PUR-${year}${month}${day}%`]
      );
      
      const count = rows[0].count + 1;
      return `PUR-${year}${month}${day}-${count.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating purchase invoice ID:', error);
      throw error;
    }
  }

  static async create(invoice_id, supplier_id, total_amount, discount = 0, paid_amount = 0, due_amount = 0, purchase_date = new Date().toISOString().split('T')[0]) {
    try {
      const [result] = await db.execute(
        'INSERT INTO purchases (invoice_id, supplier_id, total_amount, discount, paid_amount, due_amount, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [invoice_id, supplier_id, total_amount, discount, paid_amount, due_amount, purchase_date]
      );
      
      return new Purchase(
        result.insertId,
        invoice_id,
        supplier_id,
        total_amount,
        discount,
        paid_amount,
        due_amount,
        purchase_date
      );
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  static async update(id, supplier_id, total_amount, discount, paid_amount, due_amount, purchase_date) {
    try {
      await db.execute(
        'UPDATE purchases SET supplier_id = ?, total_amount = ?, discount = ?, paid_amount = ?, due_amount = ?, purchase_date = ? WHERE id = ?',
        [supplier_id, total_amount, discount, paid_amount, due_amount, purchase_date, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating purchase:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Trước khi xóa purchase, lấy tất cả chi tiết để cập nhật kho
      const [detailRows] = await db.execute(
        'SELECT * FROM purchase_details WHERE purchase_id = ?',
        [id]
      );
      
      // Xóa tất cả chi tiết
      await db.execute('DELETE FROM purchase_details WHERE purchase_id = ?', [id]);
      
      // Xóa purchase
      await db.execute('DELETE FROM purchases WHERE id = ?', [id]);
      
      // Cập nhật kho
      for (const detail of detailRows) {
        await db.execute(
          'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [detail.quantity, detail.medicine_id]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM purchases ORDER BY created_at DESC');
      
      return rows.map(
        purchase => new Purchase(
          purchase.id,
          purchase.invoice_id,
          purchase.supplier_id,
          purchase.total_amount,
          purchase.discount,
          purchase.paid_amount,
          purchase.due_amount,
          purchase.purchase_date
        )
      );
    } catch (error) {
      console.error('Error getting all purchases:', error);
      throw error;
    }
  }

  static async addPurchaseDetails(purchase_id, medicine_id, quantity, unit_price, total_price) {
    try {
      const [result] = await db.execute(
        'INSERT INTO purchase_details (purchase_id, medicine_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [purchase_id, medicine_id, quantity, unit_price, total_price]
      );
      
      // Cập nhật số lượng trong kho
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [quantity, medicine_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding purchase details:', error);
      throw error;
    }
  }

  static async getPurchaseDetails(purchase_id) {
    try {
      const [rows] = await db.execute(`
        SELECT pd.*, m.name as medicine_name, m.generic_name
        FROM purchase_details pd
        JOIN medicines m ON pd.medicine_id = m.id
        WHERE pd.purchase_id = ?
      `, [purchase_id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting purchase details:', error);
      throw error;
    }
  }

  static async getPurchaseWithDetails(id) {
    try {
      const [purchaseRows] = await db.execute(`
        SELECT p.*
        FROM purchases p
        WHERE p.id = ?
      `, [id]);
      
      if (purchaseRows.length === 0) {
        return null;
      }
      
      const purchase = purchaseRows[0];
      
      const [detailRows] = await db.execute(`
        SELECT pd.*, m.name as medicine_name, m.generic_name
        FROM purchase_details pd
        JOIN medicines m ON pd.medicine_id = m.id
        WHERE pd.purchase_id = ?
      `, [purchase.id]);
      
      return {
        ...purchase,
        details: detailRows
      };
    } catch (error) {
      console.error('Error getting purchase with details:', error);
      throw error;
    }
  }
}

module.exports = Purchase; 