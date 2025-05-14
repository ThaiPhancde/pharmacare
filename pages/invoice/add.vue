<template>
  <div class="w-full max-w-4xl mx-auto my-8">
    <h1 class="text-2xl font-bold mb-6">New Invoice</h1>
    
    <n-form
      :model="form"
      :rules="rules"
      label-placement="top"
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <n-form-item label="Date" path="date" class="col-span-1">
        <n-date-picker v-model:value="form.date" type="date" clearable />
      </n-form-item>

      <n-form-item label="Customer (Optional)" path="customer" class="col-span-1">
        <n-select
          v-model:value="form.customer"
          :options="customerOptions"
          placeholder="Select Customer"
          filterable
          clearable
        />
      </n-form-item>

      <div class="col-span-2">
        <h2 class="text-lg font-semibold mb-2">Medicine Items</h2>
        
        <n-data-table
          :columns="columns"
          :data="form.items"
          :pagination="false"
          bordered
        />

        <div class="flex justify-end mt-4">
          <n-button type="primary" secondary @click="addRow">
            Add Medicine
          </n-button>
        </div>
      </div>

      <div class="col-span-2 grid grid-cols-2 gap-4">
        <n-form-item label="Subtotal" path="subtotal">
          <n-input-number
            v-model:value="form.subtotal"
            disabled
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>

        <n-form-item label="VAT Total" path="vat_total">
          <n-input-number
            v-model:value="form.vat_total"
            disabled
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>

        <n-form-item label="Discount" path="discount">
          <n-input-number
            v-model:value="form.discount"
            @update:value="calculateTotal"
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>

        <n-form-item label="Grand Total" path="grand_total">
          <n-input-number
            v-model:value="form.grand_total"
            disabled
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>

        <n-form-item label="Paid Amount" path="paid">
          <n-input-number
            v-model:value="form.paid"
            @update:value="calculateDue"
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>

        <n-form-item label="Due Amount" path="due">
          <n-input-number
            v-model:value="form.due"
            disabled
            :formatter="(value) => `₫ ${value}`"
          />
        </n-form-item>
      </div>

      <div class="col-span-2 flex justify-end gap-4 mt-6">
        <n-button @click="resetForm">Reset</n-button>
        <n-button type="primary" @click="submitForm" :loading="submitting">
          Save Invoice
        </n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup>
import { NForm, NFormItem, NButton, NSelect, NDatePicker, NDataTable, NInputNumber, NInput } from 'naive-ui';
import { ref, h, computed, watch } from 'vue';
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();

const submitting = ref(false);

// Form state
const form = ref({
  date: Date.now(),
  customer: null,
  items: [],
  subtotal: 0,
  vat_total: 0,
  discount: 0,
  grand_total: 0,
  paid: 0,
  due: 0
});

// Validation rules
const rules = {
  date: { required: true, message: 'Date is required', trigger: 'blur' },
  items: { 
    required: true, 
    validator: (rule, value) => value.length > 0,
    message: 'At least one medicine item is required',
    trigger: 'change'
  },
  paid: { required: true, message: 'Paid amount is required', trigger: 'blur' }
};

// Options for customer selection
const customerOptions = ref([]);

// Fetch customers
const fetchCustomers = async () => {
  try {
    const response = await api.get('/api/customers', { params: { limit: 999 } });
    if (response && response.data) {
      customerOptions.value = response.data.map(customer => ({
        label: customer.full_name || customer.customer_id,
        value: customer._id
      }));
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

// Medicine options
const medicineOptions = ref([]);
const medicineStockMap = ref({});

// Fetch medicines and their stock data
const fetchMedicines = async () => {
  try {
    // Fetch medicines
    const medicineResponse = await api.get('/api/medicine', { params: { limit: 999 } });
    
    if (medicineResponse && medicineResponse.data) {
      medicineOptions.value = medicineResponse.data.map(medicine => ({
        label: medicine.name,
        value: medicine._id,
        price: medicine.price
      }));
    }
    
    // Fetch stock data
    const stockResponse = await api.get('/api/stock', { params: { limit: 999 } });
    
    if (stockResponse && stockResponse.data) {
      // Create map of medicine ID to stock details for easy lookup
      stockResponse.data.forEach(stock => {
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
  }
};

// Initialize component
onMounted(async () => {
  await Promise.all([fetchCustomers(), fetchMedicines()]);
  addRow(); // Add first row
});

// Add a new row to the medicines list
const addRow = () => {
  form.value.items.push({
    medicine: null,
    batch_id: null,
    expiry_date: null,
    quantity: 1,
    price: 0,
    vat: 0,
    subtotal: 0
  });
};

// Remove a row by index
const removeRow = (index) => {
  form.value.items.splice(index, 1);
  calculateTotals();
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

// Update item details when batch is selected
const updateItemDetails = (row, batchInfo) => {
  if (batchInfo) {
    row.expiry_date = batchInfo.expiry_date;
    row.price = batchInfo.mrp;
    row.vat = batchInfo.vat;
    
    // Set max quantity to available quantity
    if (row.quantity > batchInfo.available_qty) {
      row.quantity = batchInfo.available_qty;
    }
    
    // Calculate subtotal
    row.subtotal = row.quantity * row.price;
  }
  
  calculateTotals();
};

// Calculate all totals
const calculateTotals = () => {
  // Calculate subtotal
  form.value.subtotal = form.value.items.reduce((total, item) => total + (item.subtotal || 0), 0);
  
  // Calculate VAT total
  form.value.vat_total = form.value.items.reduce((total, item) => {
    const vatAmount = ((item.subtotal || 0) * (item.vat || 0)) / 100;
    return total + vatAmount;
  }, 0);
  
  // Calculate grand total
  calculateTotal();
};

// Calculate grand total
const calculateTotal = () => {
  form.value.grand_total = form.value.subtotal + form.value.vat_total - form.value.discount;
  calculateDue();
};

// Calculate due amount
const calculateDue = () => {
  form.value.due = form.value.grand_total - form.value.paid;
};

// Watch for changes in items to recalculate totals
watch(
  () => form.value.items,
  () => calculateTotals(),
  { deep: true }
);

// Table columns
const columns = [
  {
    title: 'Medicine',
    key: 'medicine',
    render: (row, index) => h(NSelect, {
      value: row.medicine,
      options: medicineOptions.value,
      placeholder: 'Select Medicine',
      filterable: true,
      onUpdateValue: (value) => {
        row.medicine = value;
        row.batch_id = null;
        row.expiry_date = null;
        row.price = 0;
        row.vat = 0;
        row.subtotal = 0;
        calculateTotals();
      }
    })
  },
  {
    title: 'Batch',
    key: 'batch_id',
    render: (row) => h(NSelect, {
      value: row.batch_id,
      options: getBatchOptions(row.medicine),
      placeholder: 'Select Batch',
      disabled: !row.medicine,
      onUpdateValue: (value) => {
        row.batch_id = value;
        const batchOptions = getBatchOptions(row.medicine);
        const selectedBatch = batchOptions.find(option => option.value === value);
        updateItemDetails(row, selectedBatch);
      }
    })
  },
  {
    title: 'Expiry',
    key: 'expiry_date',
    render: (row) => row.expiry_date ? new Date(row.expiry_date).toLocaleDateString() : '-'
  },
  {
    title: 'Qty',
    key: 'quantity',
    render: (row) => h(NInputNumber, {
      value: row.quantity,
      min: 1,
      max: getBatchOptions(row.medicine).find(b => b.value === row.batch_id)?.available_qty || 1,
      disabled: !row.batch_id,
      onUpdateValue: (value) => {
        row.quantity = value;
        row.subtotal = row.quantity * row.price;
        calculateTotals();
      }
    })
  },
  {
    title: 'Price',
    key: 'price',
    render: (row) => h(NInputNumber, {
      value: row.price,
      disabled: true,
      formatter: (value) => `₫ ${value}`
    })
  },
  {
    title: 'VAT (%)',
    key: 'vat',
    render: (row) => `${row.vat || 0}%`
  },
  {
    title: 'Subtotal',
    key: 'subtotal',
    render: (row) => `₫ ${row.subtotal || 0}`
  },
  {
    title: 'Action',
    key: 'action',
    render: (row, index) => h(NButton, {
      type: 'error',
      size: 'small',
      onClick: () => removeRow(index),
      disabled: form.value.items.length <= 1
    }, { default: () => 'Remove' })
  }
];

// Reset form
const resetForm = () => {
  form.value = {
    date: Date.now(),
    customer: null,
    items: [],
    subtotal: 0,
    vat_total: 0,
    discount: 0,
    grand_total: 0,
    paid: 0,
    due: 0
  };
  addRow();
};

// Submit form
const submitForm = async () => {
  try {
    submitting.value = true;
    
    // Validate form
    if (form.value.items.length === 0) {
      toast({ title: "Error", description: "Please add at least one medicine item", type: "error" });
      return;
    }
    
    // Check if any medicine or batch is not selected
    if (form.value.items.some(item => !item.medicine || !item.batch_id)) {
      toast({ title: "Error", description: "Please select medicine and batch for all items", type: "error" });
      return;
    }
    
    // Check if paid amount is valid
    if (form.value.paid < 0 || form.value.paid > form.value.grand_total) {
      toast({ title: "Error", description: "Invalid paid amount", type: "error" });
      return;
    }
    
    // Create invoice data
    const invoiceData = {
      date: form.value.date,
      customer: form.value.customer,
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
      due: form.value.due
    };
    
    // Submit invoice
    const response = await api.post('/api/invoice', invoiceData);
    
    if (response && response.status) {
      toast({ title: "Success", description: "Invoice created successfully" });
      resetForm();
    } else {
      toast({ title: "Error", description: response.error || "Failed to create invoice", type: "error" });
    }
  } catch (error) {
    toast({ title: "Error", description: error.message || "An unexpected error occurred", type: "error" });
  } finally {
    submitting.value = false;
  }
};
</script> 