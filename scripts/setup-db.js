const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // Chuỗi kết nối không có tên cơ sở dữ liệu
  const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  try {
    // Kết nối tới MySQL
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Đã kết nối tới MySQL thành công!');

    // Đọc tệp SQL
    const schemaFile = path.join(__dirname, '..', 'config', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaFile, 'utf8');

    // Thực thi các câu lệnh SQL
    console.log('Bắt đầu tạo cơ sở dữ liệu...');
    const statements = schemaSql.split(';');
    
    for (let statement of statements) {
      statement = statement.trim();
      if (statement) {
        await connection.execute(statement);
      }
    }

    console.log('Đã tạo cơ sở dữ liệu thành công!');
    
    // Đóng kết nối
    await connection.end();
    console.log('Đã đóng kết nối!');
    
  } catch (error) {
    console.error('Lỗi trong quá trình thiết lập cơ sở dữ liệu:', error);
  }
}

setupDatabase(); 