import Invoice from '@/server/models/Invoice';
import Medicine from '@/server/models/Medicine';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { medicine_id, customer_id, quantity } = body;

    if (!medicine_id || !quantity) {
      return {
        status: false,
        message: 'Thiếu thông tin medicine_id hoặc quantity',
      };
    }

    // Lấy thông tin thuốc
    const medicine = await Medicine.findById(medicine_id);
    if (!medicine) {
      return {
        status: false,
        message: 'Không tìm thấy thuốc',
      };
    }

    // Nếu không có giới hạn, cho phép mua
    if (!medicine.max_quantity_per_day) {
      return {
        status: true,
        can_purchase: true,
        message: 'Thuốc này không có giới hạn mua trong ngày',
      };
    }

    // Tính ngày hôm nay (00:00:00 đến 23:59:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Giới hạn được tính theo từng khách hàng riêng biệt
    // Mỗi khách hàng có thể mua đến giới hạn của mình, không ảnh hưởng lẫn nhau
    
    // Bắt buộc phải có customer_id để kiểm tra giới hạn
    if (!customer_id) {
      return {
        status: false,
        message: 'Customer information is required to check daily purchase limit. Please select or enter customer information.',
      };
    }

    // Kiểm tra số lượng đã mua của khách hàng này trong ngày
    const todayInvoices = await Invoice.find({
      customer: customer_id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      payment_status: { $ne: 'cancelled' },
    }).populate('items.medicine');

    // Tính tổng số lượng đã mua trong ngày của khách hàng này
    let totalPurchased = 0;
    todayInvoices.forEach((invoice) => {
      invoice.items.forEach((item: any) => {
        if (item.medicine && item.medicine._id.toString() === medicine_id.toString()) {
          totalPurchased += item.quantity || 0;
        }
      });
    });

    const remaining = medicine.max_quantity_per_day - totalPurchased;
    const canPurchase = remaining >= quantity;

    return {
      status: true,
      can_purchase: canPurchase,
      total_purchased: totalPurchased,
      max_quantity: medicine.max_quantity_per_day,
      remaining: Math.max(0, remaining),
      requested_quantity: quantity,
      message: canPurchase
        ? `Can purchase ${quantity} units. Remaining: ${remaining} units.`
        : `Daily purchase limit exceeded for this customer. Already purchased: ${totalPurchased}/${medicine.max_quantity_per_day} units today. Remaining: ${remaining} units, but requested: ${quantity} units.`,
    };
  } catch (error: any) {
    console.error('Check daily limit error:', error);
    return {
      status: false,
      message: error.message || 'Lỗi kiểm tra giới hạn mua trong ngày',
    };
  }
});

