import "@/server/models";
import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const method = event.method;
  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const populate = query.populate as string || '';
    const search = query.search as string || '';
    const barcode = query.bar_code as string || '';

    // Xây dựng query condition
    const condition: any = {};
    
    // If barcode is provided, use an exact match (high priority)
    if (barcode) {
      condition.bar_code = barcode;
      console.log(`Searching for medicine with barcode: ${barcode}`);
    } 
    // Otherwise use search term if provided
    else if (search) {
      condition.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bar_code: { $regex: search, $options: 'i' } },
        { generic: { $regex: search, $options: 'i' } }
      ];
    }

    // Tối ưu query bằng cách:
    // 1. Chỉ select các trường cần thiết
    // 2. Sử dụng lean() để giảm overhead
    // 3. Thêm index cho các trường tìm kiếm
    let medicineQuery = Medicine.find(condition)
      .skip(skip)
      .limit(limit)
      .select('name bar_code image price generic description unit_id category_id type_id')
      .sort({ createdAt: -1 })
      .lean();

    // Populate các trường chính với select tối thiểu
    medicineQuery = medicineQuery.populate([
      { 
        path: 'unit_id',
        select: 'name -_id'
      },
      { 
        path: 'category_id',
        select: 'name -_id'
      },
      { 
        path: 'type_id',
        select: 'name -_id'
      }
    ]);

    // Populate stocks nếu được yêu cầu và tối ưu bằng cách:
    // 1. Chỉ lấy các trường cần thiết
    // 2. Xóa bỏ match để lấy TẤT CẢ stocks, không chỉ là unit_quantity > 0
    // 3. Sử dụng lean()
    if (populate.includes('stocks')) {
      medicineQuery = medicineQuery.populate({
        path: 'stocks',
        select: '_id unit_quantity batch_id expiry_date purchase_price mrp vat',
        options: { lean: true }
      });
    }

    // Thực hiện song song việc đếm và lấy dữ liệu
    // Sử dụng countDocuments với điều kiện tìm kiếm
    const [data, total] = await Promise.all([
      medicineQuery,
      Medicine.countDocuments(condition)
    ]);

    // Transform data để đổi tên field từ *_id thành *
    const transformedData = data.map((item: any) => {
      const transformed = { ...item };
      if (item.category_id) {
        transformed.category = item.category_id;
        delete transformed.category_id;
      }
      if (item.unit_id) {
        transformed.unit = item.unit_id;
        delete transformed.unit_id;
      }
      if (item.type_id) {
        transformed.type = item.type_id;
        delete transformed.type_id;
      }
      
      // Đảm bảo các trường quan trọng được giữ lại và đồng bộ
      // Ensure barcode field is synchronized with bar_code
      transformed._id = item._id; // Make sure ID is included
      transformed.barcode = item.bar_code || '';
      transformed.bar_code = item.bar_code || ''; // Keep both for compatibility
      transformed.generic = item.generic || '';
      transformed.description = item.description || '';
      
      return transformed;
    });

    console.log(`Found ${data.length} medicine items with the condition:`, condition);
    if (data.length > 0) {
      console.log('First item barcode:', data[0].bar_code);
    }

    return {
      data: transformedData,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const session = await Medicine.startSession();
    session.startTransaction();

    try {
      // 1. Tạo medicine
      const createdMedicine = await Medicine.create([body], { session });

      // 2. Tạo stock liên kết với đầy đủ các trường
      // Sử dụng giá nhập và giá bán từ medicine nếu có
      await Stock.create(
        [
          {
            medicine: createdMedicine[0]._id,
            batch_id: createdMedicine[0].bar_code || `BATCH-${Date.now()}`,
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Mặc định 2 năm hạn sử dụng
            box_pattern: "",
            box_quantity: 0,
            unit_quantity: 0,
            purchase_price: createdMedicine[0].supplierPrice || 0,
            mrp: createdMedicine[0].price || 0,
            vat: 0 // Mặc định VAT là 0
          },
        ],
        { session }
      );

      // 3. Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { status: true, data: createdMedicine[0] };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction failed:", err);
      return { status: false, error: err.message || "Transaction failed" };
    }
  }
});
