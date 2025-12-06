import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import Customer from "@/server/models/Customer";
import Medicine from "@/server/models/Medicine";
import { SortOrder, Types } from "mongoose";
import { validateAndApplyVoucher } from "~/server/utils/voucher";

const generateCustomerCode = () => {
  const suffix = Date.now().toString().slice(-6);
  return `KH${suffix}`;
};

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Sort by updatedAt field in descending order (newest first)
    const sortOptions: { [key: string]: SortOrder } = { updatedAt: -1 };

    const [data, total] = await Promise.all([
      Invoice.find()
        .populate('items.medicine')
        .populate('customer')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(),
    ]);

    return {
      data,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  const buildCustomerSearchFilters = (details: any) => {
    const filters: any[] = [];
    if (details?.contact_info?.phone) {
      filters.push({ 'contact_info.phone': details.contact_info.phone });
    }
    if (details?.contact_info?.email) {
      filters.push({ 'contact_info.email': details.contact_info.email });
    }
    if (details?.full_name) {
      filters.push({ full_name: details.full_name });
    }
    return filters;
  };

  const ensureCustomerRecord = async (body: any, session: any) => {
    if (body.customer) {
      return body.customer;
    }

    const details = body.customer_details;
    if (!details || (!details.full_name && !details.contact_info)) {
      throw new Error('Customer information is required');
    }

    const filters = buildCustomerSearchFilters(details);
    let customer = null;

    if (filters.length > 0) {
      customer = await Customer.findOne({ $or: filters }).session(session);
    }

    if (!customer) {
      const [createdCustomer] = await Customer.create(
        [
          {
            customer_id: generateCustomerCode(),
            full_name: details.full_name || '',
            contact_info: {
              phone: details.contact_info?.phone || '',
              email: details.contact_info?.email || '',
              address: details.contact_info?.address || '',
            },
            medical_profile: details.medical_profile || {
              chronic_conditions: [],
              allergies: [],
              current_medications: [],
            },
          },
        ],
        { session },
      );
      customer = createdCustomer;
    } else {
      let updated = false;
      if (details.contact_info?.phone && !customer.contact_info?.phone) {
        customer.contact_info = customer.contact_info || {};
        customer.contact_info.phone = details.contact_info.phone;
        updated = true;
      }
      if (details.contact_info?.email && !customer.contact_info?.email) {
        customer.contact_info = customer.contact_info || {};
        customer.contact_info.email = details.contact_info.email;
        updated = true;
      }
      if (details.contact_info?.address && !customer.contact_info?.address) {
        customer.contact_info = customer.contact_info || {};
        customer.contact_info.address = details.contact_info.address;
        updated = true;
      }
      if (updated) {
        await customer.save({ session });
      }
    }

    return customer._id;
  };

  if (method === 'POST') {
    const body = await readBody(event);

    const session = await Invoice.startSession();
    session.startTransaction();

    try {
      body.customer = await ensureCustomerRecord(body, session);
      delete body.customer_details;

      const invoiceId = body._id || new Types.ObjectId();
      body._id = invoiceId;

      // 1. Kiểm tra stock và thuốc kê đơn trước khi tạo invoice
      const medicineIds = [...new Set(body.items.map((item: any) => item.medicine.toString()))];
      const medicines = await Medicine.find({ _id: { $in: medicineIds } }).session(session);
      const medicineMap = new Map(medicines.map((m: any) => [m._id.toString(), m]));

      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
        }).session(session);

        if (!stock) {
          throw new Error(`Stock not found for medicine: ${item.medicine} with batch: ${item.batch_id}`);
        }

        if (stock.unit_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine: ${item.medicine}. Available: ${stock.unit_quantity}, Requested: ${item.quantity}`);
        }

        // Kiểm tra thuốc kê đơn
        const medicine = medicineMap.get(item.medicine.toString());
        if (medicine && medicine.prescription_required) {
          // Thuốc kê đơn - có thể yêu cầu đơn thuốc (hiện tại chỉ cảnh báo)
          // TODO: Có thể thêm field prescription_id vào invoice item để track đơn thuốc
          console.log(`Warning: Medicine "${medicine.name}" requires prescription`);
        }
      }

      // 1.5. Kiểm tra giới hạn mua trong ngày cho từng thuốc (theo từng khách hàng)

      // Tính ngày hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const item of body.items) {
        const medicine = medicineMap.get(item.medicine.toString());
        if (!medicine) continue;

        // Nếu có giới hạn mua trong ngày
        if (medicine.max_quantity_per_day) {
          // Giới hạn được tính theo từng khách hàng riêng biệt
          // Mỗi khách hàng có thể mua đến giới hạn của mình, không ảnh hưởng lẫn nhau
          
          // Bắt buộc phải có customer để kiểm tra giới hạn
          if (!body.customer) {
            throw new Error(
              `Customer information is required to check daily purchase limit for medicine "${item.medicine_name || medicine.name}". ` +
              `Please select or enter customer information.`
            );
          }

          // Tính số lượng đã mua trong ngày của khách hàng này
          let totalPurchased = 0;
          const todayInvoices = await Invoice.find({
            customer: body.customer,
            date: { $gte: today, $lt: tomorrow },
            payment_status: { $ne: 'cancelled' },
            _id: { $ne: invoiceId }, // Loại trừ invoice hiện tại nếu đang update
          }).populate('items.medicine').session(session);

          todayInvoices.forEach((invoice: any) => {
            invoice.items.forEach((invItem: any) => {
              if (invItem.medicine && invItem.medicine._id.toString() === item.medicine.toString()) {
                totalPurchased += invItem.quantity || 0;
              }
            });
          });

          const remaining = medicine.max_quantity_per_day - totalPurchased;
          const requestedQuantity = Number(item.quantity) || 0;

          if (requestedQuantity > remaining) {
            throw new Error(
              `Medicine "${item.medicine_name || medicine.name}" has exceeded the daily purchase limit for this customer. ` +
              `Daily limit per customer: ${medicine.max_quantity_per_day} units, ` +
              `Already purchased today: ${totalPurchased} units, ` +
              `Requested: ${requestedQuantity} units, ` +
              `Remaining: ${remaining} units`
            );
          }
        }
      }

      // Handle cash payment with change calculation
      if (body.payment_method === 'cash' && body.paid > body.grand_total) {
        // Calculate change amount
        const change = body.paid - body.grand_total;

        // Store change amount in payment_details
        if (!body.payment_details) {
          body.payment_details = {};
        }
        body.payment_details.change = change;

        // For accounting purposes, we set paid to the actual amount received
        // and due to 0 since the customer has paid in full
        body.due = 0;
      } else if (body.payment_method === 'cash' && body.paid < body.grand_total) {
        // If paid less than total, calculate due amount
        body.due = body.grand_total - body.paid;
        body.payment_status = body.due > 0 ? 'partial' : 'paid';
      }

      let voucherResult = null;
      if (body.voucher_code) {
        const orderTotal = (body.subtotal || 0) + (body.vat_total || 0);
        voucherResult = await validateAndApplyVoucher({
          voucher_code: body.voucher_code,
          customer_id: body.customer,
          subtotal: orderTotal,
          items: body.items,
          commit: true,
          invoice_id: invoiceId,
          session,
        });

        body.discount = voucherResult.discount_amount;
        body.voucher_discount = voucherResult.discount_amount;
        body.voucher = voucherResult.voucher_id;
      }

      // 2. Tạo invoice
      const created = await Invoice.create([body], { session });

      // 3. Cập nhật stock (giảm số lượng)
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
        }).session(session);

        // Cập nhật số lượng
        stock.unit_quantity -= item.quantity;

        // Cập nhật box_quantity nếu cần
        if (stock.box_pattern) {
          const boxMatch = stock.box_pattern.match(/(\d+)/);
          if (boxMatch) {
            const unitsPerBox = parseInt(boxMatch[0]);
            if (unitsPerBox > 0) {
              // Tính lại số lượng hộp từ số lượng lẻ còn lại
              stock.box_quantity = Math.floor(stock.unit_quantity / unitsPerBox);
            }
          }
        }

        await stock.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return { status: true, data: created[0] };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('Invoice creation failed:', err);
      return { status: false, error: err.message || 'Transaction failed' };
    }
  }
}); 