export type VoucherDiscountType = 'percentage' | 'fixed';
export type VoucherApplicableScope = 'all' | 'medicine' | 'service' | 'category';
export type VoucherStatus = 'active' | 'inactive' | 'expired';

export interface VoucherFormState {
  voucher_code: string;
  name: string;
  description: string;
  discount_type: VoucherDiscountType;
  discount_value: number | null;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  max_users: number | null;
  start_date: number;
  end_date: number;
  applicable_to: VoucherApplicableScope;
  status: VoucherStatus;
}

export const createDefaultVoucherForm = (): VoucherFormState => {
  const now = Date.now();
  return {
    voucher_code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    usage_limit_per_customer: 1,
    max_users: null,
    start_date: now,
    end_date: now,
    applicable_to: 'all',
    status: 'active',
  };
};

const normalizeNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  if (Number.isNaN(value)) return undefined;
  return value;
};

export const serializeVoucherPayload = (form: VoucherFormState) => {
  const payload: Record<string, any> = {
    voucher_code: form.voucher_code?.trim(),
    name: form.name?.trim(),
    description: form.description?.trim() || undefined,
    discount_type: form.discount_type,
    discount_value: normalizeNumber(form.discount_value) ?? 0,
    min_purchase_amount: normalizeNumber(form.min_purchase_amount),
    usage_limit: normalizeNumber(form.usage_limit),
    usage_limit_per_customer: normalizeNumber(form.usage_limit_per_customer) ?? 1,
    max_users: normalizeNumber(form.max_users),
    start_date: new Date(form.start_date).toISOString(),
    end_date: new Date(form.end_date).toISOString(),
    applicable_to: form.applicable_to,
    status: form.status,
  };

  if (form.discount_type === 'percentage') {
    payload.max_discount_amount = normalizeNumber(form.max_discount_amount);
  }

  return payload;
};

