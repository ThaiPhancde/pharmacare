import type { ClientSession } from 'mongoose';
import { Types } from 'mongoose';
import { VoucherModel, VoucherUsageModel } from '~/server/models/Voucher';

type CartItem = {
  medicine?: string | { _id?: string };
};

interface VoucherApplyInput {
  voucher_code: string;
  customer_id?: string;
  subtotal: number;
  items?: CartItem[];
  commit?: boolean;
  invoice_id?: string | Types.ObjectId;
  session?: ClientSession | null;
}

interface VoucherApplyResult {
  voucher_id: Types.ObjectId;
  voucher_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  final_amount: number;
}

const resolveMedicineId = (medicine?: string | { _id?: string }) => {
  if (!medicine) return undefined;
  if (typeof medicine === 'string') return medicine;
  if (typeof medicine === 'object' && medicine._id) return medicine._id;
  return undefined;
};

export async function validateAndApplyVoucher({
  voucher_code,
  customer_id,
  subtotal,
  items = [],
  commit = false,
  invoice_id,
  session = null,
}: VoucherApplyInput): Promise<VoucherApplyResult> {
  if (!voucher_code) {
    throw new Error('Vui lòng nhập mã voucher');
  }

  const voucher = await VoucherModel.findOne({
    voucher_code: voucher_code.toUpperCase(),
  }).session(session);

  if (!voucher) {
    throw new Error('Mã voucher không tồn tại');
  }

  if (voucher.status !== 'active') {
    throw new Error('Voucher không hoạt động hoặc đã hết hạn');
  }

  const now = new Date();
  if (now < voucher.start_date) {
    throw new Error('Voucher chưa có hiệu lực');
  }
  if (now > voucher.end_date) {
    voucher.status = 'expired';
    await voucher.save({ session });
    throw new Error('Voucher đã hết hạn');
  }

  if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
    throw new Error('Voucher đã hết lượt sử dụng');
  }

  if (voucher.max_users) {
    if (!customer_id) {
      throw new Error('Voucher này yêu cầu đăng nhập để sử dụng');
    }

    const uniqueCustomers = await VoucherUsageModel.distinct('customer', {
      voucher: voucher._id,
      customer: { $ne: null },
    })
      .session(session || undefined);

    const normalizedCustomerId = customer_id.toString();
    const hasUsedBefore = uniqueCustomers.some(
      (id) => id && id.toString() === normalizedCustomerId,
    );

    if (uniqueCustomers.length >= voucher.max_users && !hasUsedBefore) {
      throw new Error('Voucher đã đạt giới hạn số lượng người dùng');
    }
  }

  if (customer_id && voucher.usage_limit_per_customer) {
    const usageCount = await VoucherUsageModel.countDocuments({
      voucher: voucher._id,
      customer: customer_id,
    }).session(session || undefined);

    if (usageCount >= voucher.usage_limit_per_customer) {
      throw new Error(`Bạn đã sử dụng voucher này ${voucher.usage_limit_per_customer} lần`);
    }
  }

  if (voucher.min_purchase_amount && subtotal < voucher.min_purchase_amount) {
    throw new Error(
      `Đơn hàng tối thiểu ${voucher.min_purchase_amount.toLocaleString('vi-VN')} VNĐ`,
    );
  }

  if (
    voucher.applicable_to !== 'all' &&
    voucher.applicable_items &&
    voucher.applicable_items.length > 0
  ) {
    const applicableItemIds =
      voucher.applicable_items?.map((id) => id?.toString()) || [];
    const hasApplicableItem = items.some((item) => {
      const medicineId = resolveMedicineId(item.medicine);
      if (!medicineId) return false;
      return applicableItemIds.includes(medicineId.toString());
    });

    if (!hasApplicableItem) {
      throw new Error('Voucher không áp dụng cho các sản phẩm trong đơn hàng');
    }
  }

  let discount = 0;
  if (voucher.discount_type === 'percentage') {
    discount = (subtotal * voucher.discount_value) / 100;
    if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
      discount = voucher.max_discount_amount;
    }
  } else if (voucher.discount_type === 'fixed') {
    discount = voucher.discount_value;
  }

  discount = Math.min(discount, subtotal);

  if (commit) {
    voucher.usage_count += 1;
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      voucher.status = 'expired';
    }
    await voucher.save({ session });

    // Prepare VoucherUsage data
    const voucherUsageData: any = {
      voucher: voucher._id,
      discount_amount: discount,
      used_date: new Date(),
    };

    // Convert customer_id to ObjectId if provided
    if (customer_id) {
      voucherUsageData.customer = new Types.ObjectId(customer_id.toString());
    }

    // Convert invoice_id to ObjectId if provided
    if (invoice_id) {
      voucherUsageData.invoice = invoice_id instanceof Types.ObjectId 
        ? invoice_id 
        : new Types.ObjectId(invoice_id.toString());
    }

    await VoucherUsageModel.create([voucherUsageData], { session });
  }

  return {
    voucher_id: voucher._id,
    voucher_code: voucher.voucher_code,
    discount_type: voucher.discount_type,
    discount_value: voucher.discount_value,
    discount_amount: discount,
    final_amount: subtotal - discount,
  };
}


