const db = require('../config/db');

class Medicine {
  constructor(id, name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date) {
    this.id = id;
    this.name = name;
    this.generic_name = generic_name;
    this.category = category;
    this.supplier_id = supplier_id;
    this.box_size = box_size;
    this.unit_price = unit_price;
    this.selling_price = selling_price;
    this.stock_quantity = stock_quantity;
    this.expiry_date = expiry_date;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM medicines WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const medicine = rows[0];
      return new Medicine(
        medicine.id,
        medicine.name,
        medicine.generic_name,
        medicine.category,
        medicine.supplier_id,
        medicine.box_size,
        medicine.unit_price,
        medicine.selling_price,
        medicine.stock_quantity,
        medicine.expiry_date
      );
    } catch (error) {
      console.error('Error finding medicine by ID:', error);
      throw error;
    }
  }

  static async create(name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date) {
    try {
      const [result] = await db.execute(
        'INSERT INTO medicines (name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date]
      );
      
      return new Medicine(
        result.insertId,
        name,
        generic_name,
        category,
        supplier_id,
        box_size,
        unit_price,
        selling_price,
        stock_quantity,
        expiry_date
      );
    } catch (error) {
      console.error('Error creating medicine:', error);
      throw error;
    }
  }

  static async update(id, name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date) {
    try {
      await db.execute(
        'UPDATE medicines SET name = ?, generic_name = ?, category = ?, supplier_id = ?, box_size = ?, unit_price = ?, selling_price = ?, stock_quantity = ?, expiry_date = ? WHERE id = ?',
        [name, generic_name, category, supplier_id, box_size, unit_price, selling_price, stock_quantity, expiry_date, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw error;
    }
  }

  static async updateStock(id, quantity) {
    try {
      await db.execute(
        'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [quantity, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM medicines WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM medicines');
      
      return rows.map(
        medicine => new Medicine(
          medicine.id,
          medicine.name,
          medicine.generic_name,
          medicine.category,
          medicine.supplier_id,
          medicine.box_size,
          medicine.unit_price,
          medicine.selling_price,
          medicine.stock_quantity,
          medicine.expiry_date
        )
      );
    } catch (error) {
      console.error('Error getting all medicines:', error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM medicines WHERE name LIKE ? OR generic_name LIKE ? OR category LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      
      return rows.map(
        medicine => new Medicine(
          medicine.id,
          medicine.name,
          medicine.generic_name,
          medicine.category,
          medicine.supplier_id,
          medicine.box_size,
          medicine.unit_price,
          medicine.selling_price,
          medicine.stock_quantity,
          medicine.expiry_date
        )
      );
    } catch (error) {
      console.error('Error searching medicines:', error);
      throw error;
    }
  }

  static async getTotalCount() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM medicines');
      return rows[0].count;
    } catch (error) {
      console.error('Error getting total medicine count:', error);
      throw error;
    }
  }

  static async getOutOfStockCount() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= 0');
      return rows[0].count;
    } catch (error) {
      console.error('Error getting out of stock count:', error);
      throw error;
    }
  }

  static async getExpiredCount() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM medicines WHERE expiry_date < ? AND stock_quantity > 0',
        [today]
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error getting expired medicine count:', error);
      throw error;
    }
  }

  static async getBestSelling(limit = 10) {
    try {
      const [rows] = await db.execute(`
        SELECT m.id, m.name, SUM(id.quantity) as total_sold
        FROM medicines m
        JOIN invoice_details id ON m.id = id.medicine_id
        JOIN invoices i ON id.invoice_id = i.id
        GROUP BY m.id, m.name
        ORDER BY total_sold DESC
        LIMIT ?
      `, [limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting best selling medicines:', error);
      throw error;
    }
  }
}

module.exports = Medicine; 