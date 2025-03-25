const bcrypt = require('bcryptjs');
const db = require('../config/db');

class User {
  constructor(id, username, email, password, role) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return null;
      }
      const user = rows[0];
      return new User(
        user.id,
        user.username,
        user.email,
        user.password,
        user.role
      );
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (rows.length === 0) {
        return null;
      }
      const user = rows[0];
      return new User(
        user.id,
        user.username,
        user.email,
        user.password,
        user.role
      );
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async create(username, email, password, role = 'staff') {
    try {
      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role]
      );
      
      return new User(
        result.insertId,
        username,
        email,
        hashedPassword,
        role
      );
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, username, email, role) {
    try {
      await db.execute(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute('SELECT id, username, email, role FROM users');
      
      return rows.map(
        user => new User(
          user.id,
          user.username,
          user.email,
          null, // Không trả về mật khẩu
          user.role
        )
      );
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
}

module.exports = User; 