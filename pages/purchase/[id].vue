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
  <div class="w-full bg-background text-foreground min-h-screen">
    <!-- Header with back button -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <div class="flex items-center gap-2">
        <button @click="goBack" class="text-primary hover:text-primary/80">
          ←
        </button>
        <h1 class="text-xl text-primary font-bold">Purchase Details</h1>
      </div>
      <button @click="goBack" class="px-4 py-2 border border-border rounded text-sm hover:bg-muted transition-colors">
        Back to List
      </button>
    </div>

    <!-- Loading and error states -->
    <div v-if="loading" class="flex justify-center items-center p-10">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="error" class="p-6 bg-destructive/10 border border-destructive/20 m-4 rounded">
      <h3 class="text-lg font-bold text-destructive">Error</h3>
      <p class="text-destructive">{{ error }}</p>
      <button 
        @click="fetchPurchaseDetails" 
        class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Purchase details -->
    <div v-else-if="purchase" class="p-4 space-y-4">
      <!-- Basic information card -->
      <div class="bg-card text-card-foreground rounded border border-border shadow-sm p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div class="text-muted-foreground text-sm">Invoice No</div>
            <div class="font-medium">{{ purchase.invoice_no }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Date</div>
            <div class="font-medium">{{ formatDate(purchase.date) }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Supplier</div>
            <div class="font-medium">{{ purchase.supplier?.name || 'N/A' }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Payment Type</div>
            <div class="font-medium capitalize">{{ purchase.payment_type }}</div>
          </div>
        </div>
      </div>

      <!-- Items table -->
      <div class="bg-card text-card-foreground rounded border border-border shadow-sm">
        <div class="p-4 border-b border-border">
          <h2 class="font-medium">Medicine Items</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-muted/50 text-muted-foreground">
                <th class="py-3 px-4 text-left border-b border-border">#</th>
                <th class="py-3 px-4 text-left border-b border-border">Medicine</th>
                <th class="py-3 px-4 text-left border-b border-border">Batch ID</th>
                <th class="py-3 px-4 text-left border-b border-border">Expiry Date</th>
                <th class="py-3 px-4 text-right border-b border-border">Box Pattern</th>
                <th class="py-3 px-4 text-right border-b border-border">Box Qty</th>
                <th class="py-3 px-4 text-right border-b border-border">Unit Qty</th>
                <th class="py-3 px-4 text-right border-b border-border">Price</th>
                <th class="py-3 px-4 text-right border-b border-border">VAT (%)</th>
                <th class="py-3 px-4 text-right border-b border-border">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in purchase.items" :key="index" class="border-b border-border hover:bg-muted/50 transition-colors">
                <td class="py-3 px-4">{{ index + 1 }}</td>
                <td class="py-3 px-4">{{ item.medicine?.name || 'N/A' }}</td>
                <td class="py-3 px-4">{{ item.batch_id }}</td>
                <td class="py-3 px-4">{{ formatDate(item.expiry_date) }}</td>
                <td class="py-3 px-4 text-right">{{ item.box_pattern }}</td>
                <td class="py-3 px-4 text-right">{{ item.box_quantity }}</td>
                <td class="py-3 px-4 text-right">{{ item.unit_quantity }}</td>
                <td class="py-3 px-4 text-right">{{ formatVND(item.supplier_price) }}</td>
                <td class="py-3 px-4 text-right">{{ item.vat || 0 }}%</td>
                <td class="py-3 px-4 text-right font-medium">{{ formatVND(calculateItemTotal(item)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary card -->
      <div class="bg-card text-card-foreground rounded border border-border shadow-sm p-6">
        <div class="flex justify-end">
          <div class="w-64">
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Subtotal:</span>
              <span>{{ formatVND(subtotal) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">VAT:</span>
              <span>{{ formatVND(totalVat) }}</span>
            </div>
            <div class="h-px bg-border my-2"></div>
            <div class="flex justify-between py-2">
              <span class="text-primary font-bold">Total:</span>
              <span class="text-primary font-bold">{{ formatVND(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}
</style> 