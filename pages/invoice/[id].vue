<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const invoiceId = route.params.id;

const invoice = ref(null);
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

// Fetch invoice details
const fetchInvoiceDetails = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`/api/invoice/${invoiceId}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status && data.data) {
      invoice.value = data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch invoice details');
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching invoice details:', err);
  } finally {
    loading.value = false;
  }
};

// Go back to invoice list
const goBack = () => {
  router.push('/invoice');
};

onMounted(fetchInvoiceDetails);
</script>

<template>
  <div class="w-full bg-background text-foreground min-h-screen">
    <!-- Header with back button -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <div class="flex items-center gap-2">
        <button @click="goBack" class="text-primary hover:text-primary/80">
          ←
        </button>
        <h1 class="text-xl text-primary font-bold">Invoice Details</h1>
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
        @click="fetchInvoiceDetails" 
        class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Invoice details -->
    <div v-else-if="invoice" class="p-4 space-y-4">
      <!-- Basic information card -->
      <div class="bg-card text-card-foreground rounded border border-border shadow-sm p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div class="text-muted-foreground text-sm">Invoice No</div>
            <div class="font-medium">{{ invoice.invoice_no || 'N/A' }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Date</div>
            <div class="font-medium">{{ formatDate(invoice.date) }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Customer</div>
            <div class="font-medium">{{ invoice.customer?.full_name || 'Walk-in Customer' }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Payment Method</div>
            <div class="font-medium capitalize">{{ invoice.payment_method }}</div>
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
                <th class="py-3 px-4 text-right border-b border-border">Quantity</th>
                <th class="py-3 px-4 text-right border-b border-border">Price</th>
                <th class="py-3 px-4 text-right border-b border-border">VAT (%)</th>
                <th class="py-3 px-4 text-right border-b border-border">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoice.items" :key="index" class="border-b border-border hover:bg-muted/50 transition-colors">
                <td class="py-3 px-4">{{ index + 1 }}</td>
                <td class="py-3 px-4">{{ item.medicine?.name || 'N/A' }}</td>
                <td class="py-3 px-4">{{ item.batch_id }}</td>
                <td class="py-3 px-4">{{ formatDate(item.expiry_date) }}</td>
                <td class="py-3 px-4 text-right">{{ item.quantity }}</td>
                <td class="py-3 px-4 text-right">{{ formatVND(item.price) }}</td>
                <td class="py-3 px-4 text-right">{{ item.vat || 0 }}%</td>
                <td class="py-3 px-4 text-right font-medium">{{ formatVND(item.subtotal) }}</td>
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
              <span>{{ formatVND(invoice.subtotal) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">VAT:</span>
              <span>{{ formatVND(invoice.vat_total) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Discount:</span>
              <span>{{ formatVND(invoice.discount) }}</span>
            </div>
            <div class="h-px bg-border my-2"></div>
            <div class="flex justify-between py-2">
              <span class="text-primary font-bold">Total:</span>
              <span class="text-primary font-bold">{{ formatVND(invoice.grand_total) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Paid:</span>
              <span>{{ formatVND(invoice.paid) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Due:</span>
              <span>{{ formatVND(invoice.due) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- POS indicator if applicable -->
      <div v-if="invoice.is_pos" class="bg-green-50 text-green-800 rounded border border-green-200 shadow-sm p-4 text-center">
        <span class="font-medium">POS Invoice</span>
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