<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/returns')">
          Returns
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          New Customer Return
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">New Customer Return</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Create a new return from customer
        </p>
      </div>
      
      <div class="flex gap-2">
        <n-button @click="router.back()">Cancel</n-button>
        <n-button :loading="loading" @click="saveReturn">Save Return</n-button>
      </div>
    </div>
    
    <n-card class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <n-form-item label="Return Number" required>
            <n-input v-model:value="returnForm.returnNumber" placeholder="Auto-generated" disabled />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Return Date" required>
            <n-date-picker
              v-model:value="returnForm.returnDate"
              type="date"
              class="w-full"
              :disabled="loading"
            />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Invoice" required>
            <n-select
              v-model:value="returnForm.invoiceId"
              filterable
              :options="invoiceOptions"
              placeholder="Select invoice"
              :disabled="loading"
              @update:value="handleInvoiceSelect"
            />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Customer" required>
            <n-input v-model:value="customerName" disabled />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Status" required>
            <n-select
              v-model:value="returnForm.status"
              :options="statusOptions"
              :disabled="loading"
            />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Reason" required>
            <n-select
              v-model:value="returnForm.reason"
              :options="reasonOptions"
              placeholder="Select reason"
              :disabled="loading"
            />
          </n-form-item>
        </div>
      </div>
    </n-card>
    
    <!-- Invoice Items Section -->
    <n-card class="mb-4" title="Invoice Items">
      <n-data-table
        :columns="invoiceItemsColumns"
        :data="invoiceItems"
        :pagination="false"
        :row-key="(row) => row._id || row.medicine?._id"
      />
    </n-card>
    
    <!-- Return Items Section -->
    <n-card title="Return Items">
      <div class="mb-4">
        <n-alert type="warning">
          Select items from the invoice to return. Validate the quantity to be returned.
        </n-alert>
      </div>
      
      <div class="mb-4">
        <n-data-table
          :columns="returnItemsColumns"
          :data="returnForm.items"
          :pagination="false"
          :row-key="(row) => row._id || `${row.medicineId}-${row.batchId}`"
        />
      </div>
      
      <div class="flex justify-between">
        <div>
          <n-button @click="addSelectedItemToReturn" :disabled="!selectedInvoiceItem">
            Add Selected Item
          </n-button>
        </div>
        
        <div>
          <div class="text-right text-xl">
            Total Amount: <strong>{{ formatCurrency(calculateTotal()) }}</strong>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';
import { useMessage, NButton, NInputNumber } from 'naive-ui';
import { h } from 'vue';
import { api } from '@/utils/api';

// Router
const router = useRouter();
const message = useMessage();

// State variables
const loading = ref(false);
const invoices = ref<any[]>([]);
const invoiceItems = ref<any[]>([]);
const selectedInvoiceItem = ref<any>(null);
const customerName = ref('');

// Return form
const returnForm = ref({
  returnNumber: generateReturnNumber(),
  invoiceId: '',
  customerId: '',
  returnDate: Date.now(),
  totalAmount: 0,
  reason: '',
  status: 'Pending',
  items: [] as any[]
});

// Options for dropdowns
const invoiceOptions = computed(() => {
  return invoices.value.map(invoice => ({
    label: `${invoice.invoice_number || 'No ID'} - ${new Date(invoice.date).toLocaleDateString()} - ${invoice.customer?.full_name || 'Unknown'}`,
    value: invoice._id
  }));
});

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' }
];

const reasonOptions = [
  { label: 'Wrong Item', value: 'Wrong Item' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Customer Changed Mind', value: 'Customer Changed Mind' },
  { label: 'Product Recall', value: 'Product Recall' },
  { label: 'Other', value: 'Other' }
];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0 
  }).format(value || 0);
};

// Table columns for invoice items
const invoiceItemsColumns: DataTableColumns<any> = [
  { 
    title: 'Medicine', 
    key: 'medicineName',
    render: (row) => row.medicine?.name || 'Unknown'
  },
  { title: 'Batch ID', key: 'batch_id' },
  { 
    title: 'Expiry Date', 
    key: 'expiry_date',
    render: (row) => row.expiry_date ? new Date(row.expiry_date).toLocaleDateString() : 'N/A'
  },
  { 
    title: 'Quantity', 
    key: 'quantity'
  },
  { 
    title: 'Unit Price', 
    key: 'price', 
    render: (row) => formatCurrency(row.price || 0)
  },
  { 
    title: 'Amount', 
    key: 'subtotal', 
    render: (row) => formatCurrency(row.subtotal || 0)
  },
  {
    title: 'Action',
    key: 'actions',
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => {
            selectInvoiceItem(row);
          }
        },
        { default: () => 'Select' }
      );
    }
  }
];

// Table columns for return items
const returnItemsColumns: DataTableColumns<any> = [
  { title: 'Medicine', key: 'medicineName' },
  { title: 'Batch ID', key: 'batchId' },
  { 
    title: 'Expiry Date', 
    key: 'expiryDate',
    render: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'N/A'
  },
  { 
    title: 'Quantity', 
    key: 'quantity',
    render: (row) => {
      return h(
        NInputNumber,
        {
          value: row.quantity,
          min: 1,
          max: getMaxQuantity(row),
          onUpdateValue: (value: number | null) => {
            if (value !== null) {
              updateItemQuantity(row, value);
            }
          }
        }
      );
    }
  },
  { 
    title: 'Unit Price', 
    key: 'unitPrice', 
    render: (row) => formatCurrency(row.unitPrice || 0)
  },
  { 
    title: 'Amount', 
    key: 'amount', 
    render: (row) => formatCurrency(row.amount || 0)
  },
  {
    title: 'Action',
    key: 'actions',
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          onClick: () => {
            removeItemFromReturn(row);
          }
        },
        { default: () => 'Remove' }
      );
    }
  }
];

// Generate a return number
function generateReturnNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `RET-${year}${month}${day}-${random}`;
}

// Fetch invoices
const fetchInvoices = async () => {
  try {
    loading.value = true;
    const response = await api.get('/api/invoice', {
      params: { limit: 100 }
    });
    
    if (response.status && response.data) {
      invoices.value = Array.isArray(response.data) ? response.data : [];
    } else {
      invoices.value = [];
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    invoices.value = [];
    message.error('Failed to fetch invoices');
  } finally {
    loading.value = false;
  }
};

// Handle invoice selection
const handleInvoiceSelect = async (invoiceId: string) => {
  if (!invoiceId) return;
  
  try {
    loading.value = true;
    // Fetch invoice details
    const response = await api.get(`/api/invoice/${invoiceId}`);
    
    if (response.status && response.data) {
      const invoice: any = response.data;
      
      console.log('Invoice data:', invoice); // Debug log
      
      // Set customer ID and name
      if (invoice.customer) {
        returnForm.value.customerId = invoice.customer._id || '';
        customerName.value = invoice.customer.full_name || 'Unknown';
      } else {
        returnForm.value.customerId = '';
        customerName.value = 'Walk-in Customer';
      }
      
      // Set invoice items
      if (Array.isArray(invoice.items)) {
        invoiceItems.value = invoice.items || [];
        console.log('Invoice items:', invoiceItems.value); // Debug log
      } else {
        invoiceItems.value = [];
      }
      
      // Clear return items
      returnForm.value.items = [];
      selectedInvoiceItem.value = null;
    }
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    message.error('Failed to fetch invoice details');
  } finally {
    loading.value = false;
  }
};

// Select invoice item to add to return
const selectInvoiceItem = (item: any) => {
  selectedInvoiceItem.value = item;
};

// Add selected invoice item to return
const addSelectedItemToReturn = () => {
  if (!selectedInvoiceItem.value) return;
  
  // Check if item already exists in return items
  const existingItem = returnForm.value.items.find(
    (item: any) => item.medicineId === (selectedInvoiceItem.value.medicine?._id || selectedInvoiceItem.value.medicine) && 
           item.batchId === selectedInvoiceItem.value.batch_id
  );
  
  if (existingItem) {
    message.warning('This item is already added to the return');
    return;
  }
  
  console.log('Selected item:', selectedInvoiceItem.value); // Debug log
  
  // Add item to return items
  returnForm.value.items.push({
    medicineId: selectedInvoiceItem.value.medicine?._id || selectedInvoiceItem.value.medicine,
    medicineName: selectedInvoiceItem.value.medicine?.name || 'Unknown',
    batchId: selectedInvoiceItem.value.batch_id,
    expiryDate: selectedInvoiceItem.value.expiry_date,
    quantity: 1, // Default quantity to return
    unitPrice: selectedInvoiceItem.value.price || 0,
    amount: selectedInvoiceItem.value.price || 0 // Calculate initial amount
  });
  
  // Update total
  updateTotalAmount();
  
  selectedInvoiceItem.value = null;
};

// Remove item from return
const removeItemFromReturn = (item: any) => {
  const index = returnForm.value.items.findIndex(
    (i: any) => i.medicineId === item.medicineId && i.batchId === item.batchId
  );
  
  if (index !== -1) {
    returnForm.value.items.splice(index, 1);
    updateTotalAmount();
  }
};

// Update item quantity
const updateItemQuantity = (item: any, quantity: number) => {
  const index = returnForm.value.items.findIndex(
    (i: any) => i.medicineId === item.medicineId && i.batchId === item.batchId
  );
  
  if (index !== -1) {
    returnForm.value.items[index].quantity = quantity;
    returnForm.value.items[index].amount = quantity * returnForm.value.items[index].unitPrice;
    updateTotalAmount();
  }
};

// Get maximum quantity that can be returned
const getMaxQuantity = (item: any) => {
  // Check stock availability
  const invoiceItem = invoiceItems.value.find(
    (i: any) => (i.medicine?._id || i.medicine) === item.medicineId && i.batch_id === item.batchId
  );
  
  return invoiceItem ? invoiceItem.quantity : 0;
};

// Calculate total amount
const calculateTotal = () => {
  return returnForm.value.items.reduce((total: number, item: any) => total + (item.amount || 0), 0);
};

// Update total amount in form
const updateTotalAmount = () => {
  returnForm.value.totalAmount = calculateTotal();
};

// Save the return
const saveReturn = async () => {
  // Validate form
  if (!returnForm.value.invoiceId) {
    message.error('Please select an invoice');
    return;
  }
  
  if (!returnForm.value.items.length) {
    message.error('Please add at least one item to return');
    return;
  }
  
  if (!returnForm.value.reason) {
    message.error('Please select a reason for the return');
    return;
  }
  
  loading.value = true;
  console.log('Saving return with data:', returnForm.value); // Debug log
  
  try {
    // Send API request to create return
    const response = await api.post('/api/returns/customer', returnForm.value);
    console.log('Save response:', response); // Debug log
    
    if (response.status) {
      message.success('Return created successfully');
      // Hiển thị return number để xác nhận
      const responseData: any = response.data;
      if (responseData && responseData.returnNumber) {
        message.info(`Return number: ${responseData.returnNumber}`);
      }
      setTimeout(() => {
        router.push('/returns');
      }, 1500);
    } else {
      message.error((response as any).error || 'Failed to create return');
    }
  } catch (error: any) {
    console.error('Error creating return:', error);
    message.error('Failed to create return: ' + (error.message || 'Unknown error'));
  } finally {
    loading.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchInvoices();
});

// Update document title
useHead({
  title: 'New Customer Return'
});
</script> 