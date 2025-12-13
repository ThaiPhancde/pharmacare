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

    // Nếu không có giới hạn nào, cho phép mua
    if (!medicine.max_quantity_per_day && !medicine.max_quantity_per_month) {
      return {
        status: true,
        can_purchase: true,
        message: 'Thuốc này không có giới hạn mua',
      };
    }

    // Bắt buộc phải có customer_id để kiểm tra giới hạn
    if (!customer_id) {
      return {
        status: false,
        message: 'Customer information is required to check purchase limit. Please select or enter customer information.',
      };
    }

    // Tính ngày hôm nay (00:00:00 đến 23:59:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Tính 30 ngày trước
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Kiểm tra số lượng đã mua của khách hàng này
    // 1. Trong ngày hôm nay
    const todayInvoices = await Invoice.find({
      customer: customer_id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      payment_status: { $ne: 'cancelled' },
    }).populate('items.medicine');

    // 2. Trong 30 ngày qua
    const monthInvoices = await Invoice.find({
      customer: customer_id,
      date: {
        $gte: thirtyDaysAgo,
        $lt: tomorrow,
      },
      payment_status: { $ne: 'cancelled' },
    }).populate('items.medicine').populate('customer');

    // Tính tổng số lượng đã mua trong ngày
    let totalPurchasedToday = 0;
    todayInvoices.forEach((invoice) => {
      invoice.items.forEach((item: any) => {
        if (item.medicine && item.medicine._id.toString() === medicine_id.toString()) {
          totalPurchasedToday += item.quantity || 0;
        }
      });
    });

    // Tính tổng số lượng đã mua trong 30 ngày
    let totalPurchasedMonth = 0;
    const purchaseHistory: any[] = [];
    
    monthInvoices.forEach((invoice) => {
      invoice.items.forEach((item: any) => {
        if (item.medicine && item.medicine._id.toString() === medicine_id.toString()) {
          totalPurchasedMonth += item.quantity || 0;
          
          // Lưu lịch sử mua
          purchaseHistory.push({
            date: invoice.date,
            quantity: item.quantity,
            customer_name: invoice.customer?.full_name || invoice.customer?.name || 'N/A',
            invoice_id: invoice._id,
          });
        }
      });
    });

    // Sắp xếp lịch sử theo ngày gần nhất
    purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Kiểm tra giới hạn daily
    let dailyLimitExceeded = false;
    let dailyRemaining = 0;
    if (medicine.max_quantity_per_day) {
      dailyRemaining = medicine.max_quantity_per_day - totalPurchasedToday;
      dailyLimitExceeded = dailyRemaining < quantity;
    }

    // Kiểm tra giới hạn monthly
    let monthlyLimitExceeded = false;
    let monthlyRemaining = 0;
    if (medicine.max_quantity_per_month) {
      monthlyRemaining = medicine.max_quantity_per_month - totalPurchasedMonth;
      monthlyLimitExceeded = monthlyRemaining < quantity;
    }

    const canPurchase = !dailyLimitExceeded && !monthlyLimitExceeded;

    // Tạo thông báo
    let message = '';
    if (!canPurchase) {
      const messages = [];
      if (dailyLimitExceeded) {
        messages.push(
          `Daily limit exceeded: ${totalPurchasedToday}/${medicine.max_quantity_per_day} units purchased today. Remaining: ${Math.max(0, dailyRemaining)} units.`
        );
      }
      if (monthlyLimitExceeded) {
        messages.push(
          `Monthly limit exceeded: ${totalPurchasedMonth}/${medicine.max_quantity_per_month} units purchased in last 30 days. Remaining: ${Math.max(0, monthlyRemaining)} units.`
        );
      }
      message = messages.join(' ');
    } else {
      const messages = [];
      if (medicine.max_quantity_per_day) {
        messages.push(`Daily: ${dailyRemaining} units remaining`);
      }
      if (medicine.max_quantity_per_month) {
        messages.push(`Monthly: ${monthlyRemaining} units remaining`);
      }
      message = `Can purchase ${quantity} units. ${messages.join(', ')}`;
    }

    return {
      status: true,
      can_purchase: canPurchase,
      daily: {
        limit: medicine.max_quantity_per_day || null,
        purchased: totalPurchasedToday,
        remaining: Math.max(0, dailyRemaining),
        exceeded: dailyLimitExceeded,
      },
      monthly: {
        limit: medicine.max_quantity_per_month || null,
        purchased: totalPurchasedMonth,
        remaining: Math.max(0, monthlyRemaining),
        exceeded: monthlyLimitExceeded,
      },
      purchase_history: purchaseHistory,
      requested_quantity: quantity,
      message,
    };
  } catch (error: any) {
    console.error('Check purchase limit error:', error);
    return {
      status: false,
      message: error.message || 'Lỗi kiểm tra giới hạn mua hàng',
    };
  }
});
