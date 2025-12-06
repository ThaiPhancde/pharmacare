#!/usr/bin/env node

/**
 * Script để xóa thuốc từ MongoDB trực tiếp
 * IDs cần xóa:
 * - Medocillin 500mg: 680799094e083ca8e3390f7e
 * - Clarityn: 6807995806fdd585b12e38cd
 * - Zantac 150mg: 68079add4e083ca8e3390fc1
 * - Lorfast: 68079b1606fdd585b12e3932
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Connection URL (từ runtime config hoặc env)
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://anthaiphanxuan:anthai8c@pharmacare.hdwbxsq.mongodb.net/pharmacare?retryWrites=true&w=majority&appName=PharmaCare';

// IDs của các thuốc cần xóa
const medicineIds = [
  '680799094e083ca8e3390f7e', // Medocillin 500mg
  '6807995806fdd585b12e38cd', // Clarityn
  '68079add4e083ca8e3390fc1', // Zantac 150mg
  '68079b1606fdd585b12e3932'  // Lorfast
];

const medicineNames = {
  '680799094e083ca8e3390f7e': 'Medocillin 500mg',
  '6807995806fdd585b12e38cd': 'Clarityn',
  '68079add4e083ca8e3390fc1': 'Zantac 150mg',
  '68079b1606fdd585b12e3932': 'Lorfast'
};

// Schema đơn giản cho Medicine và Stock
const MedicineSchema = new mongoose.Schema({}, { strict: false, collection: 'medicines' });
const StockSchema = new mongoose.Schema({}, { strict: false, collection: 'stocks' });

const Medicine = mongoose.model('Medicine', MedicineSchema);
const Stock = mongoose.model('Stock', StockSchema);

async function deleteMedicine(id) {
  try {
    console.log(`\n🗑️  Đang xóa: ${medicineNames[id] || id}...`);
    
    // Tìm thuốc để lấy bar_code
    const medicine = await Medicine.findById(id);
    
    if (!medicine) {
      console.log(`   ⚠️  Không tìm thấy thuốc với ID: ${id}`);
      return { success: false, id, name: medicineNames[id], error: 'Not found' };
    }
    
    const barCode = medicine.bar_code;
    const medicineName = medicine.name || medicineNames[id];
    
    console.log(`   📦 Tên: ${medicineName}`);
    console.log(`   🏷️  Barcode: ${barCode || 'N/A'}`);
    
    // Xóa Stock liên quan
    if (barCode) {
      const stockResult = await Stock.deleteMany({ batch_id: barCode });
      console.log(`   📊 Đã xóa ${stockResult.deletedCount} stock record(s)`);
    }
    
    // Xóa Medicine
    const medicineResult = await Medicine.findByIdAndDelete(id);
    
    if (medicineResult) {
      console.log(`   ✅ Đã xóa thành công: ${medicineName}`);
      return { success: true, id, name: medicineName };
    } else {
      console.log(`   ❌ Không thể xóa thuốc`);
      return { success: false, id, name: medicineName, error: 'Delete failed' };
    }
  } catch (error) {
    console.log(`   ❌ Lỗi: ${error.message}`);
    return { success: false, id, name: medicineNames[id], error: error.message };
  }
}

async function main() {
  console.log('🚀 Bắt đầu xóa thuốc từ MongoDB...');
  console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`📋 Số lượng thuốc cần xóa: ${medicineIds.length}\n`);

  try {
    // Kết nối MongoDB
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    const results = [];
    
    for (const id of medicineIds) {
      const result = await deleteMedicine(id);
      results.push(result);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Xóa thành công: ${successful.length}`);
    successful.forEach(r => {
      console.log(`   - ${r.name} (ID: ${r.id})`);
    });
    
    if (failed.length > 0) {
      console.log(`\n❌ Xóa thất bại: ${failed.length}`);
      failed.forEach(r => {
        console.log(`   - ${r.name} (ID: ${r.id}): ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Đóng kết nối
    await mongoose.disconnect();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
    
    if (failed.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Lỗi không mong đợi:', error);
  process.exit(1);
});

