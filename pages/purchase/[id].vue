<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const purchaseId = route.params.id;

const purchase = ref(null);
const loading = ref(true);
const error = ref(null);

// Format currency
const formatVND = (value) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value);
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Calculate total for each item
const calculateItemTotal = (item) => {
  return (item.supplier_price || 0) * (item.unit_quantity || 0);
};

// Calculate subtotal
const subtotal = computed(() => {
  if (!purchase.value) return 0;
  return purchase.value.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
});

// Calculate total VAT
const totalVat = computed(() => {
  if (!purchase.value) return 0;
  return purchase.value.items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item);
    return sum + (itemTotal * (item.vat || 0) / 100);
  }, 0);
});

// Calculate grand total
const grandTotal = computed(() => {
  return subtotal.value + totalVat.value;
});

// Fetch purchase details
const fetchPurchaseDetails = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`/api/purchase/${purchaseId}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status && data.data) {
      purchase.value = data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch purchase details');
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching purchase details:', err);
  } finally {
    loading.value = false;
  }
};

// Go back to purchase list
const goBack = () => {
  router.push('/purchase');
};

onMounted(fetchPurchaseDetails);
</script>

<template>
  <div class="w-full min-h-screen">
    <!-- Header with back button -->
    <n-card>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <n-button quaternary @click="goBack">
            ←
          </n-button>
          <h1 class="text-xl font-bold">Purchase Details</h1>
        </div>
        <n-button @click="goBack">
          Back to List
        </n-button>
      </div>
    </n-card>

    <!-- Loading and error states -->
    <div v-if="loading" class="flex justify-center items-center p-10">
      <n-spin size="large" />
    </div>
    
    <n-result 
      v-else-if="error" 
      status="error" 
      :title="error" 
      :description="error"
    >
      <template #footer>
        <n-button @click="fetchPurchaseDetails">
          Try Again
        </n-button>
      </template>
    </n-result>

    <!-- Purchase details -->
    <div v-else-if="purchase" class="p-4 space-y-4">
      <!-- Basic information card -->
      <n-card>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div class="text-sm text-gray-500">Invoice No</div>
            <div class="font-medium">{{ purchase.invoice_no }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Date</div>
            <div class="font-medium">{{ formatDate(purchase.date) }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Supplier</div>
            <div class="font-medium">{{ purchase.supplier?.name || 'N/A' }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Payment Type</div>
            <div class="font-medium capitalize">{{ purchase.payment_type }}</div>
          </div>
        </div>
      </n-card>

      <!-- Items table -->
      <n-card title="Medicine Items">
        <n-table :bordered="true" :single-line="false">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Batch ID</th>
              <th>Expiry Date</th>
              <th class="text-right">Box Pattern</th>
              <th class="text-right">Box Qty</th>
              <th class="text-right">Unit Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">VAT (%)</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in purchase.items" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.medicine?.name || 'N/A' }}</td>
              <td>{{ item.batch_id }}</td>
              <td>{{ formatDate(item.expiry_date) }}</td>
              <td class="text-right">{{ item.box_pattern }}</td>
              <td class="text-right">{{ item.box_quantity }}</td>
              <td class="text-right">{{ item.unit_quantity }}</td>
              <td class="text-right">{{ formatVND(item.supplier_price) }}</td>
              <td class="text-right">{{ item.vat || 0 }}%</td>
              <td class="text-right font-medium">{{ formatVND(calculateItemTotal(item)) }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <!-- Summary card -->
      <n-card>
        <div class="flex justify-end">
          <div class="w-64">
            <div class="flex justify-between py-2">
              <span class="text-gray-500">Subtotal:</span>
              <span>{{ formatVND(subtotal) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-gray-500">VAT:</span>
              <span>{{ formatVND(totalVat) }}</span>
            </div>
            <n-divider />
            <div class="flex justify-between py-2">
              <span class="font-bold">Total:</span>
              <span class="font-bold">{{ formatVND(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-card) {
  margin-bottom: 16px;
}
</style> 