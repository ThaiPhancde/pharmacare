<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/returns')">
          Returns
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          New Supplier Return
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">New Supplier Return</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Create a new return to supplier
        </p>
      </div>
      
      <div class="flex gap-2">
        <n-button @click="router.back()">Cancel</n-button>
        <n-button type="primary" :loading="loading" @click="saveReturn">Save Return</n-button>
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
          <n-form-item label="Purchase" required>
            <n-select
              v-model:value="returnForm.purchaseId"
              filterable
              :options="purchaseOptions"
              placeholder="Select purchase"
              :disabled="loading"
              @update:value="handlePurchaseSelect"
            />
          </n-form-item>
        </div>
        
        <div>
          <n-form-item label="Supplier" required>
            <n-input v-model:value="supplierName" disabled />
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
    
    <!-- Purchase Items Section -->
    <n-card class="mb-4" title="Purchase Items">
      <n-data-table
        :columns="purchaseItemsColumns"
        :data="purchaseItems"
        :pagination="false"
        :row-key="(row) => row._id || `${row.medicineId}-${row.batchId}`"
      />
    </n-card>
    
    <!-- Return Items Section -->
    <n-card title="Return Items">
      <div class="mb-4">
        <n-alert type="warning">
          Select items from the purchase to return. Specify the reason and quantity to be returned.
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
          <n-button type="primary" @click="addSelectedItemToReturn" :disabled="!selectedPurchaseItem">
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
const purchases = ref<any[]>([]);
const purchaseItems = ref<any[]>([]);
const selectedPurchaseItem = ref<any>(null);
const supplierName = ref('');

// Return form
const returnForm = ref({
  returnNumber: generateReturnNumber(),
  purchaseId: '',
  supplierId: '',
  returnDate: Date.now(),
  totalAmount: 0,
  reason: '',
  status: 'Pending',
  items: [] as any[]
});

// Options for dropdowns
const purchaseOptions = computed(() => {
  return purchases.value.map(purchase => ({
    label: `${purchase.invoice_no} - ${new Date(purchase.date).toLocaleDateString()} - ${purchase.supplier?.name || 'Unknown'}`,
    value: purchase._id
  }));
});

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' }
];

const reasonOptions = [
  { label: 'Damaged', value: 'Damaged' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Wrong Item', value: 'Wrong Item' },
  { label: 'Quality Issue', value: 'Quality Issue' },
  { label: 'Product Recall', value: 'Product Recall' },
  { label: 'Other', value: 'Other' }
];

// Table columns for purchase items
const purchaseItemsColumns: DataTableColumns<any> = [
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
    key: 'unit_quantity',
    render: (row) => `${row.unit_quantity} units`
  },
  { 
    title: 'Unit Price', 
    key: 'supplier_price', 
    render: (row) => formatCurrency(row.supplier_price || 0)
  },
  { 
    title: 'Amount', 
    key: 'amount', 
    render: (row) => formatCurrency((row.supplier_price || 0) * (row.unit_quantity || 0))
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
            selectPurchaseItem(row);
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

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0 
  }).format(value || 0);
};

// Generate a return number
function generateReturnNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `SRET-${year}${month}${day}-${random}`;
}

// Fetch purchases
const fetchPurchases = async () => {
  try {
    loading.value = true;
    const response = await api.get('/api/purchase', {
      params: { limit: 100 }
    });
    
    if (response.status && response.data) {
      purchases.value = Array.isArray(response.data) ? response.data : [];
    } else {
      purchases.value = [];
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
    purchases.value = [];
    message.error('Failed to fetch purchases');
  } finally {
    loading.value = false;
  }
};

// Handle purchase selection
const handlePurchaseSelect = async (purchaseId: string) => {
  if (!purchaseId) return;
  
  try {
    loading.value = true;
    // Fetch purchase details
    const response = await api.get(`/api/purchase/${purchaseId}`);
    
    if (response.status && response.data) {
      const purchase = response.data as any;
      
      // Set supplier ID and name
      returnForm.value.supplierId = purchase.supplier?._id || '';
      supplierName.value = purchase.supplier?.name || 'Unknown';
      
      // Set purchase items
      purchaseItems.value = purchase.items || [];
      
      // Clear return items
      returnForm.value.items = [];
      selectedPurchaseItem.value = null;
    }
  } catch (error) {
    console.error('Error fetching purchase details:', error);
    message.error('Failed to fetch purchase details');
  } finally {
    loading.value = false;
  }
};

// Select purchase item to add to return
const selectPurchaseItem = (item: any) => {
  selectedPurchaseItem.value = item;
};

// Add selected purchase item to return
const addSelectedItemToReturn = () => {
  if (!selectedPurchaseItem.value) return;
  
  // Check if item already exists in return items
  const existingItem = returnForm.value.items.find(
    item => item.medicineId === (selectedPurchaseItem.value.medicine?._id || selectedPurchaseItem.value.medicine) && 
           item.batchId === selectedPurchaseItem.value.batch_id
  );
  
  if (existingItem) {
    message.warning('This item is already added to the return');
    return;
  }
  
  // Add item to return items
  returnForm.value.items.push({
    medicineId: selectedPurchaseItem.value.medicine?._id || selectedPurchaseItem.value.medicine,
    medicineName: selectedPurchaseItem.value.medicine?.name || 'Unknown',
    batchId: selectedPurchaseItem.value.batch_id,
    expiryDate: selectedPurchaseItem.value.expiry_date,
    quantity: 1, // Default quantity to return
    unitPrice: selectedPurchaseItem.value.supplier_price || 0,
    amount: selectedPurchaseItem.value.supplier_price || 0 // Calculate initial amount
  });
  
  // Update total
  updateTotalAmount();
  
  selectedPurchaseItem.value = null;
};

// Remove item from return
const removeItemFromReturn = (item: any) => {
  const index = returnForm.value.items.findIndex(
    i => i.medicineId === item.medicineId && i.batchId === item.batchId
  );
  
  if (index !== -1) {
    returnForm.value.items.splice(index, 1);
    updateTotalAmount();
  }
};

// Update item quantity
const updateItemQuantity = (item: any, quantity: number) => {
  const index = returnForm.value.items.findIndex(
    i => i.medicineId === item.medicineId && i.batchId === item.batchId
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
  const purchaseItem = purchaseItems.value.find(
    i => (i.medicine?._id || i.medicine) === item.medicineId && i.batch_id === item.batchId
  );
  
  return purchaseItem ? purchaseItem.unit_quantity : 0;
};

// Calculate total amount
const calculateTotal = () => {
  return returnForm.value.items.reduce((total, item) => total + (item.amount || 0), 0);
};

// Update total amount in form
const updateTotalAmount = () => {
  returnForm.value.totalAmount = calculateTotal();
};

// Save the return
const saveReturn = async () => {
  // Validate form
  if (!returnForm.value.purchaseId) {
    message.error('Please select a purchase');
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
  
  try {
    // Send API request to create return
    const response = await api.post('/api/returns/supplier', returnForm.value);
    
    if (response.status) {
      message.success('Return created successfully');
      router.push('/returns');
    } else {
      message.error((response as any).error || 'Failed to create return');
    }
  } catch (error) {
    console.error('Error creating return:', error);
    message.error('Failed to create return');
  } finally {
    loading.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchPurchases();
});

// Update document title
useHead({
  title: 'New Supplier Return'
});
</script> 