import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import Customer from "@/server/models/Customer";
import Medicine from "@/server/models/Medicine";
import { ShiftModel } from '~/server/models/HRExtended';
import mongoose from 'mongoose';
import { validateAndApplyVoucher } from '~/server/utils/voucher';

const generateCustomerCode = () => {
  const suffix = Date.now().toString().slice(-6);
  return `KH${suffix}`;
};

export default defineEventHandler(async (event) => {
  const method = event.method;

  // Chỉ hỗ trợ POST cho POS Invoice
  if (method === 'POST') {
    const body = await readBody(event);

    // Đảm bảo đánh dấu đây là POS invoice
    body.is_pos = true;
    if (!body._id) {
      body._id = `INV-CUS-${Date.now()}`;
      console.log('Generated invoice ID:', body._id);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Creating POS invoice with payment method:', body.payment_method);

      // Tạo danh sách stocks để lưu dữ liệu tạm thời
      const stockItems = [];

      // 1. Lấy thông tin medicines và kiểm tra stock, thuốc kê đơn
      const medicineIds = [...new Set(body.items.map((item: any) => item.medicine.toString()))];
      const medicines = await Medicine.find({ _id: { $in: medicineIds } }).session(session);
      const medicineMap = new Map(medicines.map((m: any) => [m._id.toString(), m]));

      // 1.1. Kiểm tra stock và thuốc kê đơn
      for (const item of body.items) {
        // Tìm stock theo stock_id nếu có, nếu không thì tìm theo medicine và batch_id
        let stock;
        if (item.stock_id) {
          stock = await Stock.findById(item.stock_id).session(session);
        } else {
          stock = await Stock.findOne({
            medicine: item.medicine,
            batch_id: item.batch_id,
          }).session(session);
        }

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

        // Lưu lại stock để sử dụng sau
        stockItems.push({ stock, quantity: item.quantity });
      }

      // 1.2. Tạo customer mới TRƯỚC KHI kiểm tra daily limit (nếu có customer_details)
      // Điều này đảm bảo customer ID có sẵn khi check daily limit
      if (body.customer_details && !body.customer) {
        const customerData = {
          customer_id: generateCustomerCode(),
          full_name: body.customer_details.full_name || '',
          contact_info: body.customer_details.contact_info || {},
          created_at: new Date(),
        };

        const newCustomer = await Customer.create([customerData], { session });
        body.customer = newCustomer[0]._id;
        console.log('Created new customer:', newCustomer[0].customer_id, newCustomer[0].full_name);
        
        // Xóa customer_details vì đã tạo customer rồi
        delete body.customer_details;
      }

      // 1.3. Kiểm tra giới hạn mua trong ngày cho từng thuốc (theo từng khách hàng)

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
            _id: { $ne: body._id }, // Loại trừ invoice hiện tại nếu đang update
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

      // Xóa các trường không cần thiết và đảm bảo giá được set đúng
      body.items.forEach((item: any) => {
        // Đảm bảo price là số và > 0
        item.price = Number(item.price) || 0;
        if (item.price <= 0) {
          throw new Error(`Invalid price for item: ${item.medicine_name || item.medicine}. Price must be greater than 0.`);
        }

        // Đảm bảo quantity là số và > 0
        item.quantity = Number(item.quantity) || 1;
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for item: ${item.medicine_name || item.medicine}. Quantity must be greater than 0.`);
        }

        // Tính lại subtotal để đảm bảo đúng
        item.subtotal = item.price * item.quantity;

        // Đảm bảo vat là số
        item.vat = Number(item.vat) || 0;

        // Xóa các trường không cần thiết
        delete item.stock_id;
        delete item.days_left;
        delete item.original_price;
        delete item.discount_percentage;
        delete item.discount_reason;
        delete item.purchase;
      });

      let voucherResult = null;
      if (body.voucher_code) {
        const orderTotal = (body.subtotal || 0) + (body.vat_total || 0);
        // Validate voucher first without committing (commit = false)
        voucherResult = await validateAndApplyVoucher({
          voucher_code: body.voucher_code,
          customer_id: body.customer,
          subtotal: orderTotal,
          items: body.items,
          commit: false, // Don't commit yet, wait until invoice is created
          invoice_id: body._id,
          session,
        });

        body.discount = voucherResult.discount_amount;
        body.voucher_discount = voucherResult.discount_amount;
        body.voucher = voucherResult.voucher_id;
      }

      // 2. Tạo invoice 

      // Đảm bảo payment_status được đặt đúng
      if (!body.payment_status) {
        body.payment_status = 'paid';
      }

      // Handle cash payment with change calculation
      if (body.payment_method === 'cash') {
        const amountPaid = Number(body.paid);
        const grandTotal = Number(body.grand_total);

        if (amountPaid > grandTotal) {
          // Calculate change amount
          const change = amountPaid - grandTotal;

          // Store change amount in payment_details
          if (!body.payment_details) {
            body.payment_details = {};
          }
          body.payment_details.change = change;

          // For accounting purposes, we keep paid as the actual amount received
          // and due as 0 since the customer has paid in full
          body.due = 0;
          console.log(`Cash payment with change: Paid ${amountPaid}, Total ${grandTotal}, Change ${change}`);
        } else if (amountPaid < grandTotal) {
          // If paid less than total, calculate due amount
          body.due = grandTotal - amountPaid;
          body.payment_status = 'partial';
          console.log(`Partial payment: Paid ${amountPaid}, Total ${grandTotal}, Due ${body.due}`);
        } else {
          // Exact payment
          body.due = 0;
          console.log(`Exact payment: Paid ${amountPaid}, Total ${grandTotal}`);
        }
      }

      // Link invoice to shift if provided or find active shift
      try {
        if (body.shift_id) {
          // Use shift_id if provided from frontend
          const shift = await ShiftModel.findById(body.shift_id).session(session);
          if (shift && shift.status === 'active') {
            body.shift = shift._id;
            console.log(`Invoice linked to shift from frontend: ${shift._id}`);
          } else {
            console.warn(`Shift ${body.shift_id} not found or not active`);
          }
        } else if (body.employee_id) {
          // Try to find active shift for the employee
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const activeShift = await ShiftModel.findOne({
            employee: body.employee_id,
            status: 'active',
            shift_date: {
              $gte: today,
              $lte: tomorrow
            }
          }).sort({ actual_start_time: -1 }).session(session);

          if (activeShift) {
            body.shift = activeShift._id;
            // Set created_by to the employee of the shift
            if (activeShift.employee) {
              body.created_by = activeShift.employee;
            }
            console.log(`Invoice linked to active shift for employee: ${activeShift._id}`);
          } else {
            console.log(`No active shift found for employee ${body.employee_id}`);
          }
        } else {
          // Fallback: find any active shift today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const activeShift = await ShiftModel.findOne({
            status: 'active',
            shift_date: {
              $gte: today,
              $lte: tomorrow
            }
          }).sort({ actual_start_time: -1 }).session(session);

          if (activeShift) {
            body.shift = activeShift._id;
            // Set created_by to the employee of the shift
            if (activeShift.employee) {
              body.created_by = activeShift.employee;
            }
            console.log(`Invoice linked to most recent active shift: ${activeShift._id}`);
          } else {
            console.log('No active shift found. Invoice will be created without shift link.');
          }
        }

        // Set created_by if employee_id is provided and not already set
        if (body.employee_id && !body.created_by) {
          body.created_by = body.employee_id;
        }
      } catch (shiftError: any) {
        console.warn('Error linking shift to invoice:', shiftError);
        // Continue without shift link
      }

      console.log('Creating invoice with data:', JSON.stringify(body, null, 2));
      const created = await Invoice.create([body], { session });
      console.log('Invoice created with ID:', created[0]._id);

      // 2.5. Commit voucher usage after invoice is created
      if (voucherResult && body.voucher_code) {
        const orderTotal = (body.subtotal || 0) + (body.vat_total || 0);
        try {
          await validateAndApplyVoucher({
            voucher_code: body.voucher_code,
            customer_id: body.customer,
            subtotal: orderTotal,
            items: body.items,
            commit: true, // Now commit with the actual invoice ID
            invoice_id: created[0]._id, // Use the created invoice's _id
            session,
          });
          console.log('Voucher usage committed successfully');
        } catch (voucherErr: any) {
          console.error('Failed to commit voucher usage:', voucherErr);
          // Don't fail the transaction if voucher commit fails, but log it
          // The voucher was already validated, so this is just recording usage
        }
      }

      // 3. Cập nhật stock (giảm số lượng)
      for (const stockItem of stockItems) {
        const stock = stockItem.stock;
        const quantity = stockItem.quantity;

        // Cập nhật số lượng trong database
        stock.unit_quantity -= quantity;

        // Cập nhật box_quantity nếu cần
        if (stock.box_pattern) {
          const boxMatch = stock.box_pattern.match(/(\d+)/);
          if (boxMatch) {
            const unitsPerBox = parseInt(boxMatch[0]);
            if (unitsPerBox > 0) {
              stock.box_quantity = Math.floor(stock.unit_quantity / unitsPerBox);
            }
          }
        }

        // Lưu thay đổi vào database
        await stock.save({ session });
        console.log(`Stock updated: Medicine ID ${stock.medicine}, New quantity: ${stock.unit_quantity}`);
      }

      // Đảm bảo transaction được commit
      await session.commitTransaction();
      session.endSession();

      return {
        status: true,
        data: created[0],
        message: "POS Invoice created successfully"
      };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('POS Invoice creation failed:', err);
      return {
        status: false,
        error: err.message || 'Transaction failed',
        message: "Failed to create POS Invoice"
      };
    }
  } else {
    return {
      status: false,
      message: "Method not allowed. Only POST is supported for POS Invoice."
    };
  }
}); 