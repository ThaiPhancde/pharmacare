import { d as defineEventHandler, a as getQuery, i as CustomerModel, M as Medicine, S as Stock, I as Invoice } from '../../_/nitro.mjs';
import 'mongoose';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'zod';
import 'bcryptjs';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const index = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const currentDate = /* @__PURE__ */ new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const twoMonthsAgoStart = new Date(currentYear, currentMonth - 2, 1);
    const [currentMonthCustomers, previousMonthCustomers] = await Promise.all([
      CustomerModel.countDocuments({ created_at: { $gte: currentMonthStart } }),
      CustomerModel.countDocuments({
        created_at: {
          $gte: previousMonthStart,
          $lt: currentMonthStart
        }
      })
    ]);
    const totalMedicine = await Medicine.countDocuments();
    const today = /* @__PURE__ */ new Date();
    const expiredMedicinesCount = await Stock.countDocuments({
      expiry_date: { $lt: today },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 30);
    const expiringMedicinesCount = await Stock.countDocuments({
      expiry_date: { $gte: today, $lte: expiryDate },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    const customerPercentChange = previousMonthCustomers > 0 ? (currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers * 100 : 0;
    const [currentMonthSales, previousMonthSales] = await Promise.all([
      Invoice.find({
        date: { $gte: currentMonthStart }
      }),
      Invoice.find({
        date: {
          $gte: previousMonthStart,
          $lt: currentMonthStart
        }
      })
    ]);
    const currentMonthTotalSales = currentMonthSales.reduce((sum, invoice) => sum + (invoice.grand_total || 0), 0);
    const previousMonthTotalSales = previousMonthSales.reduce((sum, invoice) => sum + (invoice.grand_total || 0), 0);
    const salesPercentChange = previousMonthTotalSales > 0 ? (currentMonthTotalSales - previousMonthTotalSales) / previousMonthTotalSales * 100 : 0;
    const recentSales = await Invoice.find().populate("customer").sort({ createdAt: -1 }).limit(5);
    const formattedRecentSales = recentSales.map((sale) => {
      var _a, _b, _c;
      return {
        _id: sale._id,
        customer_name: ((_a = sale.customer) == null ? void 0 : _a.full_name) || "Walk-in Customer",
        customer_email: ((_c = (_b = sale.customer) == null ? void 0 : _b.contact_info) == null ? void 0 : _c.email) || "No email",
        amount: sale.grand_total || 0,
        date: sale.date,
        payment_method: sale.payment_method || "cash"
      };
    });
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastWeekExpiredCount = await Stock.countDocuments({
      expiry_date: { $lt: lastWeek },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    const expiredMedicineChange = expiredMedicinesCount - lastWeekExpiredCount;
    return {
      status: true,
      data: {
        cardData: {
          totalCustomer: await CustomerModel.countDocuments(),
          totalCustomerDesc: customerPercentChange,
          totalMedicine,
          totalMedicineDesc: 0,
          // Không có dữ liệu so sánh
          sales: expiredMedicinesCount,
          // Hiển thị số thuốc đã hết hạn thay vì out of stock
          salesDesc: 0,
          // Thuốc đã hết hạn
          expiredMedicine: expiringMedicinesCount,
          // Số thuốc sắp hết hạn trong 30 ngày
          expiredMedicineDesc: expiredMedicineChange
        },
        recentSales: formattedRecentSales
      },
      message: "L\u1EA5y d\u1EEF li\u1EC7u dashboard th\xE0nh c\xF4ng"
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      status: false,
      error: "Kh\xF4ng th\u1EC3 l\u1EA5y d\u1EEF li\u1EC7u dashboard"
    };
  }
});

export { index as default };
//# sourceMappingURL=index5.mjs.map
