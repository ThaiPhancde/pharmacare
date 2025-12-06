<template>
  <n-card class="bg-gray-50 border-l-4 border-primary shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-primary">Create New Invoice</h2>
    </div>
    
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      class="grid grid-cols-2 gap-4"
    >
      <!-- Customer Info -->
      <div class="col-span-2">
        <n-alert type="info" class="mb-4">
          Customers are created automatically when you save an invoice. Start typing to search existing customers or enter a new one.
        </n-alert>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Customer Name">
            <n-auto-complete
              v-model:value="customerSearch"
              :options="customerAutoOptions"
              placeholder="Enter or search customer name"
              clearable
              @select="handleCustomerSelect"
            />
          </n-form-item>
          <n-form-item label="Phone">
            <n-input
              v-model:value="customerDetails.phone"
              placeholder="Phone number"
              :disabled="isExistingCustomer"
            />
          </n-form-item>
          <n-form-item label="Email">
            <n-input
              v-model:value="customerDetails.email"
              placeholder="Email address"
              :disabled="isExistingCustomer"
            />
          </n-form-item>
          <n-form-item label="Address">
            <n-input
              v-model:value="customerDetails.address"
              placeholder="Address"
              :disabled="isExistingCustomer"
            />
          </n-form-item>
        </div>
        <div class="flex flex-wrap justify-between items-center text-sm text-gray-600">
          <span v-if="isExistingCustomer">
            Using saved customer {{ selectedCustomerRecord?.customer_id || '' }}.
          </span>
          <span v-else>
            A new customer record will be created when this invoice is saved.
          </span>
          <n-button v-if="isExistingCustomer" size="small" quaternary @click="clearCustomerSelection">
            Use new customer
          </n-button>
        </div>
      </div>

      <n-form-item label="Date" path="date">
        <n-date-picker 
          v-model:value="form.date" 
          type="date" 
          clearable 
          value-format="timestamp"
        />
      </n-form-item>

      <n-form-item label="Invoice No" path="invoice_no">
        <n-input
          v-model:value="form.invoice_no"
          placeholder="Auto generated"
          disabled
        />
      </n-form-item>

      <n-form-item label="Payment Method" path="payment_method">
        <n-select
          v-model:value="form.payment_method"
          :options="paymentOptions"
          placeholder="Select payment method"
        />
      </n-form-item>

      <!-- Medicine List -->
      <div class="col-span-2">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-primary">Medicine List</h3>
          <n-button type="primary" @click="addMedicineItem" class="bg-primary">
            Add Medicine
          </n-button>
        </div>

        <div v-for="(item, index) in form.items" :key="index" class="mb-4 p-4 border rounded-lg border-gray-200 hover:border-primary transition-colors">
          <div class="grid grid-cols-3 gap-4">
            <n-form-item :label="'Medicine ' + (index + 1)" :path="'items[' + index + '].medicine'">
              <n-select
                v-model:value="item.medicine"
                :options="medicineOptions"
                placeholder="Select medicine"
                filterable
                @update:value="(val) => handleMedicineSelect(val, index)"
              />
            </n-form-item>

            <n-form-item label="Batch" :path="'items[' + index + '].batch_id'">
              <n-select
                v-model:value="item.batch_id"
                :options="getBatchOptions(item.medicine)"
                placeholder="Select batch"
                filterable
                :disabled="!item.medicine"
                @update:value="(val) => handleBatchSelect(val, item.medicine, index)"
              />
            </n-form-item>

            <n-form-item label="Expiry Date" :path="'items[' + index + '].expiry_date'">
              <n-date-picker
                v-model:value="item.expiry_date"
                type="date"
                clearable
                disabled
              />
            </n-form-item>

            <n-form-item label="Quantity" :path="'items[' + index + '].quantity'">
              <n-input-number 
                v-model:value="item.quantity" 
                :min="1" 
                :max="item.max_quantity || 1"
                :disabled="!item.batch_id"
                @update:value="updateItemTotal(item)"
              />
            </n-form-item>

            <n-form-item label="Price" :path="'items[' + index + '].price'">
              <n-input-number 
                v-model:value="item.price" 
                :min="0"
                disabled
              />
            </n-form-item>

            <n-form-item label="VAT (%)" :path="'items[' + index + '].vat'">
              <n-input-number 
                v-model:value="item.vat" 
                :min="0" 
                :max="100"
                disabled
              />
            </n-form-item>

            <n-form-item label="Subtotal" :path="'items[' + index + '].subtotal'" class="col-span-3">
              <n-input-number
                v-model:value="item.subtotal"
                :min="0"
                disabled
                :formatter="value => `${value.toLocaleString('vi-VN')} ₫`"
              />
            </n-form-item>
          </div>
          
          <div class="flex justify-end mt-2">
            <n-button type="error" class="bg-red-500 hover:bg-red-600 text-white" @click="removeMedicineItem(index)">
              Remove
            </n-button>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="col-span-2">
        <n-card title="Summary" class="mt-4 border-t-4 border-primary">
          <div class="flex justify-end">
            <div class="grid grid-cols-2 gap-4 min-w-[300px]">
              <div class="text-right text-gray-600">Subtotal:</div>
              <div class="font-medium">{{ formatVND(calculateSubTotal) }}</div>
              
              <div class="text-right text-gray-600">VAT Total:</div>
              <div class="font-medium">{{ formatVND(calculateVatTotal) }}</div>

          <div class="col-span-2 border-t pt-4">
            <div class="flex flex-col gap-2">
              <div class="flex flex-wrap gap-2">
                <n-input
                  v-model:value="voucherCode"
                  placeholder="Voucher code"
                  class="flex-1"
                  :disabled="voucherApplying"
                />
                <n-button
                  type="primary"
                  :loading="voucherApplying"
                  :disabled="!canApplyVoucher"
                  @click="applyVoucherCode"
                >
                  Apply
                </n-button>
                <n-button
                  v-if="appliedVoucher"
                  type="default"
                  @click="removeVoucher"
                >
                  Remove
                </n-button>
              </div>
              <div v-if="appliedVoucher">
                <n-alert type="success" :closable="false">
                  Applied {{ appliedVoucher.voucher_code }} – saved {{ formatVND(appliedVoucher.discount_amount) }}.
                  <span v-if="voucherNeedsRefresh" class="block text-amber-600 mt-1">
                    Cart updated. Please re-apply to keep this discount.
                  </span>
                </n-alert>
              </div>
              <div v-else-if="voucherMessage">
                <n-alert type="default" :closable="false">
                  {{ voucherMessage }}
                </n-alert>
              </div>
            </div>
          </div>
              
              <div class="text-right text-gray-600">Discount:</div>
              <div class="font-medium">
                <n-input-number 
                  v-model:value="form.discount" 
                  :min="0" 
                  :max="calculateSubTotal + calculateVatTotal"
              @update:value="updateGrandTotal"
              :disabled="!!appliedVoucher"
                  :formatter="value => `${value.toLocaleString('vi-VN')} ₫`"
                />
              </div>
              
              <div class="text-right font-bold text-primary">Grand Total:</div>
              <div class="font-bold text-primary">{{ formatVND(form.grand_total) }}</div>
              
              <div class="text-right text-gray-600">Amount Paid:</div>
              <div class="font-medium">
                <n-input-number 
                  v-model:value="form.paid" 
                  :min="0"
                  @update:value="updateDue"
                  :formatter="value => `${value.toLocaleString('vi-VN')} ₫`"
                />
              </div>
              
              <div class="text-right font-bold text-primary">Due Amount:</div>
              <div class="font-bold text-primary">{{ formatVND(form.due) }}</div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Submit buttons -->
      <div class="col-span-2 flex justify-end gap-4 mt-4">
        <n-button @click="resetForm" class="bg-gray-100 hover:bg-gray-200 text-gray-700">Reset</n-button>
        <n-button type="primary" @click="handleSubmit" class="bg-primary hover:bg-primary-dark">Save Invoice</n-button>
      </div>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { api } from '@/utils/api';
import { useRouter } from 'vue-router';
import { useToast } from '@/components/ui/toast';

const router = useRouter();
const toast = useToast();

const formRef = ref(null);
const form = ref({
  customer: null,
  date: Date.now(),
  invoice_no: null,
  payment_method: 'cash',
  items: [],
  subtotal: 0,
  vat_total: 0,
  discount: 0,
  grand_total: 0,
  paid: 0,
  due: 0,
  is_pos: false
});

const customers = ref<any[]>([]);
const customerSearch = ref('');
const customerDetails = reactive({
  full_name: '',
  phone: '',
  email: '',
  address: '',
});
const selectedCustomerRecord = ref<any | null>(null);
const medicineOptions = ref([]);
const medicineStockMap = ref({});

const paymentOptions = [
  { label: "Cash", value: "cash" },
  { label: "Credit Card", value: "card" },
  { label: "Bank Transfer", value: "bank" }
];

const customerAutoOptions = computed(() => customers.value.map((customer) => ({
  label: `${customer.full_name || 'Unnamed'} (${customer.customer_id})`,
  value: customer.full_name || customer.customer_id || '',
  id: customer._id,
})));

const voucherCode = ref('');
const voucherApplying = ref(false);
const voucherMessage = ref('');
const appliedVoucher = ref<any | null>(null);
const voucherNeedsRefresh = ref(false);
const voucherBaselineTotal = ref(0);

// Fetch medicines
const fetchMedicines = async () => {
  try {
    const res = await api.get("/api/medicine", { params: { limit: 100 } });
    
    if (res.status && res.data) {
      medicineOptions.value = res.data.map(medicine => ({
        label: medicine.prescription_required 
          ? `${medicine.name} (Rx)` 
          : medicine.name,
        value: medicine._id,
        prescription_required: medicine.prescription_required,
        max_quantity_per_day: medicine.max_quantity_per_day
      }));
    }
    
    // Fetch stock data for medicines
    const stockRes = await api.get("/api/stock", { params: { limit: 999 } });
    
    if (stockRes.status && stockRes.data) {
      // Create map of medicine ID to stock details for easy lookup
      stockRes.data.forEach(stock => {
        if (stock.medicine) {
          if (!medicineStockMap.value[stock.medicine._id]) {
            medicineStockMap.value[stock.medicine._id] = [];
          }
          
          medicineStockMap.value[stock.medicine._id].push({
            batch_id: stock.batch_id,
            expiry_date: stock.expiry_date,
            unit_quantity: stock.unit_quantity,
            mrp: stock.mrp,
            vat: stock.vat
          });
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch medicines or stock:', error);
    toast.error('Failed to load medicines or stock');
  }
};

// Fetch customers
const fetchCustomers = async () => {
  try {
    const res = await api.get("/api/customers", { params: { limit: 500 } });
    
    if (res.status && res.data) {
      customers.value = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    toast.error('Failed to load customers');
  }
};

const isExistingCustomer = computed(() => !!selectedCustomerRecord.value);

const updateCustomerDetails = (customer: any | null) => {
  if (customer) {
    customerDetails.full_name = customer.full_name || '';
    customerDetails.phone = customer.contact_info?.phone || '';
    customerDetails.email = customer.contact_info?.email || '';
    customerDetails.address = customer.contact_info?.address || '';
  } else {
    customerDetails.full_name = '';
    customerDetails.phone = '';
    customerDetails.email = '';
    customerDetails.address = '';
  }
};

const clearCustomerSelection = () => {
  selectedCustomerRecord.value = null;
  form.value.customer = null;
  customerSearch.value = '';
  updateCustomerDetails(null);
};

const handleCustomerSelect = (value: string, option: any) => {
  if (option?.id) {
    const customer = customers.value.find((c) => c._id === option.id);
    if (customer) {
      selectedCustomerRecord.value = customer;
      form.value.customer = customer._id;
      customerSearch.value = customer.full_name || customer.customer_id || value;
      updateCustomerDetails(customer);
      return;
    }
  }
};

watch(customerSearch, (value) => {
  if (!value) {
    clearCustomerSelection();
    return;
  }

  if (!selectedCustomerRecord.value || (selectedCustomerRecord.value && selectedCustomerRecord.value.full_name !== value)) {
    form.value.customer = null;
    selectedCustomerRecord.value = null;
    customerDetails.full_name = value;
  }
});

// Function to generate next invoice number
const generateInvoiceNo = async () => {
  try {
    const res = await api.get("/api/invoice", { params: { limit: 1 } });
    
    let nextNumber = 1;
    
    if (res.status && res.data && res.data.length > 0) {
      const lastInvoice = res.data[0].invoice_no;
      const match = lastInvoice?.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    form.value.invoice_no = `INV-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    form.value.invoice_no = `INV-${timestamp}`;
  }
};

// Get batch options for a selected medicine
const getBatchOptions = (medicineId) => {
  if (!medicineId || !medicineStockMap.value[medicineId]) {
    return [];
  }
  
  return medicineStockMap.value[medicineId].map(stock => ({
    label: `${stock.batch_id} (Exp: ${new Date(stock.expiry_date).toLocaleDateString()}) - Qty: ${stock.unit_quantity}`,
    value: stock.batch_id,
    expiry_date: stock.expiry_date,
    mrp: stock.mrp,
    vat: stock.vat,
    available_qty: stock.unit_quantity
  }));
};

// Handle medicine selection
const handleMedicineSelect = (medicineId, index) => {
  if (!medicineId) {
    const item = form.value.items[index];
    item.batch_id = null;
    item.expiry_date = null;
    item.price = 0;
    item.vat = 0;
    item.quantity = 1;
    item.max_quantity = 1;
    item.subtotal = 0;
    updateTotals();
  }
};

// Handle batch selection
const handleBatchSelect = (batchId, medicineId, index) => {
  if (!batchId || !medicineId) return;
  
  const batchOptions = getBatchOptions(medicineId);
  const selectedBatch = batchOptions.find(option => option.value === batchId);
  
  if (selectedBatch) {
    const item = form.value.items[index];
    item.expiry_date = selectedBatch.expiry_date;
    item.price = selectedBatch.mrp;
    item.vat = selectedBatch.vat;
    item.max_quantity = selectedBatch.available_qty;
    
    // Ensure quantity doesn't exceed available stock
    if (item.quantity > selectedBatch.available_qty) {
      item.quantity = selectedBatch.available_qty;
    }
    
    updateItemTotal(item);
  }
};

// Update item total
const updateItemTotal = (item) => {
  item.subtotal = item.quantity * item.price;
  updateTotals();
};

// Calculate subtotal
const calculateSubTotal = computed(() => {
  return form.value.items.reduce((total, item) => total + (item.subtotal || 0), 0);
});

// Calculate VAT total
const calculateVatTotal = computed(() => {
  return form.value.items.reduce((total, item) => {
    const vatAmount = ((item.subtotal || 0) * (item.vat || 0)) / 100;
    return total + vatAmount;
  }, 0);
});

const orderTotal = computed(() => calculateSubTotal.value + calculateVatTotal.value);

watch(orderTotal, (total) => {
  if (appliedVoucher.value) {
    voucherNeedsRefresh.value = total !== voucherBaselineTotal.value;
  }
});

// Update totals
const updateTotals = () => {
  form.value.subtotal = calculateSubTotal.value;
  form.value.vat_total = calculateVatTotal.value;
  updateGrandTotal();
};

// Update grand total
const updateGrandTotal = () => {
  form.value.grand_total = form.value.subtotal + form.value.vat_total - form.value.discount;
  updateDue();
};

// Update due amount
const updateDue = () => {
  form.value.due = form.value.grand_total - form.value.paid;
};

const canApplyVoucher = computed(() => form.value.items.length > 0 && orderTotal.value > 0);

const buildVoucherPayload = (commit = false) => ({
  voucher_code: voucherCode.value,
  customer_id: form.value.customer,
  subtotal: orderTotal.value,
  items: form.value.items.map(item => ({
    medicine: item.medicine,
    quantity: item.quantity,
  })),
  commit,
});

const applyVoucherCode = async () => {
  if (!voucherCode.value?.trim()) {
    toast.error('Please enter voucher code');
    return;
  }

  if (!form.value.items.length) {
    toast.error('Add at least one item before applying voucher');
    return;
  }

  voucherApplying.value = true;
  try {
    const response = await api.post('/api/voucher/apply', buildVoucherPayload(false));
    if (response.status) {
      appliedVoucher.value = response.data;
      form.value.discount = response.data.discount_amount;
      updateGrandTotal();
      voucherMessage.value = response.message;
      voucherBaselineTotal.value = orderTotal.value;
      voucherNeedsRefresh.value = false;
      toast.success(response.message);
    } else {
      toast.error(response.message || 'Failed to apply voucher');
    }
  } catch (error: any) {
    console.error('Apply voucher error:', error);
    toast.error(error.message || 'Failed to apply voucher');
  } finally {
    voucherApplying.value = false;
  }
};

const removeVoucher = () => {
  appliedVoucher.value = null;
  voucherCode.value = '';
  voucherMessage.value = '';
  voucherBaselineTotal.value = 0;
  voucherNeedsRefresh.value = false;
  form.value.discount = 0;
  updateGrandTotal();
};

// Add medicine item
const addMedicineItem = () => {
  form.value.items.push({
    medicine: null,
    batch_id: null,
    expiry_date: null,
    quantity: 1,
    price: 0,
    vat: 0,
    subtotal: 0,
    max_quantity: 1
  });
};

// Remove medicine item
const removeMedicineItem = (index) => {
  form.value.items.splice(index, 1);
  updateTotals();
};

// Validation rules
const rules = {
  date: { 
    required: true, 
    message: "Please select date", 
    trigger: ["blur", "change"],
    type: 'number',
    validator: (rule, value) => value !== null && value !== undefined && !isNaN(value)
  },
  invoice_no: { required: true, message: "Invoice number is required", trigger: "blur" },
  payment_method: { required: true, message: "Please select payment method", trigger: "change" },
  "items": {
    type: "array",
    required: true,
    message: "At least one item is required",
    trigger: "change",
    validator: (rule, value) => value && value.length > 0
  },
  "items[].medicine": { required: true, message: "Please select medicine", trigger: "change" },
  "items[].batch_id": { required: true, message: "Please select batch", trigger: "change" },
  "items[].quantity": { 
    required: true, 
    type: "number", 
    min: 1, 
    message: "Quantity must be at least 1", 
    trigger: "change" 
  },
  paid: {
    required: true,
    type: "number",
    message: "Paid amount is required",
    trigger: "change"
  }
};

// Reset form
const resetForm = async () => {
  form.value = {
    customer: null,
    date: Date.now(),
    invoice_no: null,
    payment_method: 'cash',
    items: [],
    subtotal: 0,
    vat_total: 0,
    discount: 0,
    grand_total: 0,
    paid: 0,
    due: 0,
    is_pos: false
  };
  clearCustomerSelection();
  removeVoucher();
  
  addMedicineItem(); // Add first empty item
  await generateInvoiceNo(); // Generate new invoice number
};

// Handle form submission
const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }
    
    try {
      if (appliedVoucher.value && voucherNeedsRefresh.value) {
        toast.error('Cart changed after applying voucher. Please re-apply the voucher code.');
        return;
      }
      
      // Check if any medicine or batch is not selected
      if (form.value.items.some(item => !item.medicine || !item.batch_id)) {
        toast.error("Please select medicine and batch for all items");
        return;
      }
      
      // Check if paid amount is valid
      if (form.value.paid < 0) {
        toast.error("Paid amount cannot be negative");
        return;
      }
      
      // Check prescription required and daily limits
      const medicineIds = form.value.items.map(item => item.medicine).filter(Boolean);
      if (medicineIds.length > 0) {
        const medicinesResponse = await api.get('/api/medicine', {
          params: { 
            ids: medicineIds.join(','),
            limit: 9999
          }
        });
        
        if (medicinesResponse.data) {
          const medicineMap = new Map(medicinesResponse.data.map((m: any) => [m._id, m]));
          
          // Check prescription required
          for (const item of form.value.items) {
            if (!item.medicine) continue;
            const medicine = medicineMap.get(item.medicine);
            if (medicine && medicine.prescription_required) {
              // Warning for prescription required (can be enhanced later)
              console.log(`Warning: Medicine "${medicine.name}" requires prescription`);
            }
            
            // Check daily limit
            if (medicine && medicine.max_quantity_per_day) {
              const customerId = form.value.customer || null;
              const limitCheck = await api.post('/api/invoice/check-daily-limit', {
                medicine_id: item.medicine,
                customer_id: customerId,
                quantity: item.quantity
              });
              
              if (limitCheck.status && !limitCheck.can_purchase) {
                toast.error(limitCheck.message || `Thuốc "${medicine.name}" đã vượt quá giới hạn mua trong ngày`);
                return;
              }
            }
          }
        }
      }
      
      // Create invoice data
      const invoiceData = {
        date: form.value.date,
        customer: form.value.customer,
        invoice_no: form.value.invoice_no,
        payment_method: form.value.payment_method,
        items: form.value.items.map(item => ({
          medicine: item.medicine,
          batch_id: item.batch_id,
          expiry_date: item.expiry_date,
          quantity: item.quantity,
          price: item.price,
          vat: item.vat,
          subtotal: item.subtotal
        })),
        subtotal: form.value.subtotal,
        vat_total: form.value.vat_total,
        discount: form.value.discount,
        grand_total: form.value.grand_total,
        paid: form.value.paid,
        due: form.value.due,
        is_pos: false
      };
      
      if (!invoiceData.customer && customerDetails.full_name?.trim()) {
        invoiceData.customer_details = {
          full_name: customerDetails.full_name,
          contact_info: {
            phone: customerDetails.phone,
            email: customerDetails.email,
            address: customerDetails.address,
          },
        };
      }
      
      if (appliedVoucher.value) {
        invoiceData.voucher_code = appliedVoucher.value.voucher_code;
        invoiceData.voucher_discount = appliedVoucher.value.discount_amount;
        invoiceData.voucher = appliedVoucher.value.voucher_id;
      }
      
      const response = await api.post('/api/invoice', invoiceData);
      
      if (response.status) {
        toast.success('Invoice created successfully');
        resetForm();
        router.push('/invoice');
        if (appliedVoucher.value) {
          removeVoucher();
        }
      } else {
        toast.error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'An unexpected error occurred');
    }
  });
};

// Format currency
const formatVND = (value) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value);
};

// Init
onMounted(async () => {
  try {
    await Promise.all([
      fetchMedicines(),
      fetchCustomers(),
      generateInvoiceNo()
    ]);
    
    addMedicineItem(); // Add first empty item
  } catch (error) {
    console.error('Error initializing:', error);
    toast.error('Failed to initialize data');
  }
});
</script> 