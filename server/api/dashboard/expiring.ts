import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const days = parseInt(query.days as string) || 30; // Mặc định 30 ngày
    const limit = parseInt(query.limit as string) || 5; // Mặc định lấy 5 records

    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + days);

    // Lấy danh sách thuốc sắp hết hạn
    const expiringMedicines = await Stock.find({
      expiry_date: { $gte: today, $lte: expiryDate },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    })
      .populate("medicine")
      .sort({ expiry_date: 1 })
      .limit(limit);

    // Thêm thông tin về số ngày còn lại đến hạn sử dụng
    const enhancedData = expiringMedicines.map(item => {
      const expiryTime = new Date(item.expiry_date).getTime();
      const todayTime = today.getTime();
      const diffTime = expiryTime - todayTime;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...item.toObject(),
        daysLeft,
        medicineName: item.medicine?.name || 'Unknown',
        batchId: item.batch_id,
        expiryDate: item.expiry_date
      };
    });

    return {
      status: true,
      data: enhancedData,
      message: "Lấy dữ liệu thuốc sắp hết hạn thành công"
    };
  } catch (error) {
    console.error("Error fetching expiring medicines:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu thuốc sắp hết hạn"
    };
  }
}); 