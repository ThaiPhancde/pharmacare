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
        :row-key="(row) => row.id"
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
          :row-key="(row) => row.id || row.medicineId + row.batchId"
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
            Total Amount: <strong>${{ calculateTotal().toFixed(2) }}</strong>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import type { SupplierReturn, SupplierReturnItem } from '~/models/returns';
import { DataTableColumns } from 'naive-ui';

// Router
const router = useRouter();

// State variables
const loading = ref(false);
const purchases = ref([]);
const purchaseItems = ref([]);
const selectedPurchaseItem = ref(null);
const supplierName = ref('');

// Return form
const returnForm = ref<SupplierReturn>({
  returnNumber: generateReturnNumber(),
  purchaseId: '',
  supplierId: '',
  returnDate: Date.now(),
  totalAmount: 0,
  reason: '',
  status: 'Pending',
  items: []
});

// Options for dropdowns
const purchaseOptions = computed(() => {
  return purchases.value.map(purchase => ({
    label: `${purchase.purchaseNumber} - ${new Date(purchase.date).toLocaleDateString()}`,
    value: purchase.id
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
const purchaseItemsColumns: DataTableColumns = [
  { title: 'Medicine', key: 'medicineName' },
  { title: 'Batch ID', key: 'batchId' },
  { title: 'Expiry Date', key: 'expiryDate' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Unit Price', key: 'unitPrice', render: (row) => `$${row.unitPrice.toFixed(2)}` },
  { title: 'Amount', key: 'amount', render: (row) => `$${row.amount.toFixed(2)}` },
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
const returnItemsColumns: DataTableColumns = [
  { title: 'Medicine', key: 'medicineName' },
  { title: 'Batch ID', key: 'batchId' },
  { title: 'Expiry Date', key: 'expiryDate' },
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
          onUpdateValue: (value) => updateItemQuantity(row, value)
        }
      );
    }
  },
  { title: 'Unit Price', key: 'unitPrice', render: (row) => `$${row.unitPrice.toFixed(2)}` },
  { title: 'Amount', key: 'amount', render: (row) => `$${row.amount.toFixed(2)}` },
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
  
  return `SRET-${year}${month}${day}-${random}`;
}

// Fetch purchases
const fetchPurchases = async () => {
  try {
    const data = await $fetch('/api/purchase');
    purchases.value = data;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    purchases.value = [];
  }
};

// Handle purchase selection
const handlePurchaseSelect = async (purchaseId) => {
  if (!purchaseId) return;
  
  try {
    // Fetch purchase details
    const purchase = await $fetch(`/api/purchase/${purchaseId}`);
    
    // Set supplier ID and name
    returnForm.value.supplierId = purchase.supplierId;
    const supplier = await $fetch(`/api/suppliers/${purchase.supplierId}`);
    supplierName.value = supplier.name;
    
    // Set purchase items
    purchaseItems.value = purchase.items || [];
    
    // Clear return items
    returnForm.value.items = [];
    selectedPurchaseItem.value = null;
  } catch (error) {
    console.error('Error fetching purchase details:', error);
    window.$message.error('Failed to fetch purchase details');
  }
};

// Select purchase item to add to return
const selectPurchaseItem = (item) => {
  selectedPurchaseItem.value = item;
};

// Add selected purchase item to return
const addSelectedItemToReturn = () => {
  if (!selectedPurchaseItem.value) return;
  
  // Check if item already exists in return items
  const existingItem = returnForm.value.items.find(
    item => item.medicineId === selectedPurchaseItem.value.medicineId && 
           item.batchId === selectedPurchaseItem.value.batchId
  );
  
  if (existingItem) {
    window.$message.warning('This item is already added to the return');
    return;
  }
  
  // Add item to return items
  returnForm.value.items.push({
    medicineId: selectedPurchaseItem.value.medicineId,
    medicineName: selectedPurchaseItem.value.medicineName,
    batchId: selectedPurchaseItem.value.batchId,
    expiryDate: selectedPurchaseItem.value.expiryDate,
    quantity: 1, // Default quantity to return
    unitPrice: selectedPurchaseItem.value.unitPrice,
    amount: selectedPurchaseItem.value.unitPrice // Calculate initial amount
  });
  
  // Update total
  updateTotalAmount();
  
  selectedPurchaseItem.value = null;
};

// Remove item from return
const removeItemFromReturn = (item) => {
  const index = returnForm.value.items.findIndex(
    i => i.medicineId === item.medicineId && i.batchId === item.batchId
  );
  
  if (index !== -1) {
    returnForm.value.items.splice(index, 1);
    updateTotalAmount();
  }
};

// Update item quantity
const updateItemQuantity = (item, quantity) => {
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
const getMaxQuantity = (item) => {
  // Check stock availability
  const purchaseItem = purchaseItems.value.find(
    i => i.medicineId === item.medicineId && i.batchId === item.batchId
  );
  
  return purchaseItem ? purchaseItem.quantity : 0;
};

// Calculate total amount
const calculateTotal = () => {
  return returnForm.value.items.reduce((total, item) => total + item.amount, 0);
};

// Update total amount in form
const updateTotalAmount = () => {
  returnForm.value.totalAmount = calculateTotal();
};

// Save the return
const saveReturn = async () => {
  // Validate form
  if (!returnForm.value.purchaseId) {
    window.$message.error('Please select a purchase');
    return;
  }
  
  if (!returnForm.value.items.length) {
    window.$message.error('Please add at least one item to return');
    return;
  }
  
  if (!returnForm.value.reason) {
    window.$message.error('Please select a reason for the return');
    return;
  }
  
  loading.value = true;
  
  try {
    // Send API request to create return
    const data = await $fetch('/api/returns/supplier', {
      method: 'POST',
      body: returnForm.value
    });
    
    window.$message.success('Return created successfully');
    router.push('/returns');
  } catch (error) {
    console.error('Error creating return:', error);
    window.$message.error('Failed to create return');
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