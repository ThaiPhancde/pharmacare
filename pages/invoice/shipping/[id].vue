<template>
  <div>
    <n-page-header 
      title="Create Shipping Order"
      @back="router.back()"
    >
      <template #subtitle>
        <span>Invoice: {{ invoiceId }}</span>
      </template>
    </n-page-header>
    
    <n-grid :cols="1" :x-gap="12" :y-gap="12" class="p-4">
      <template v-if="loading">
        <n-grid-item>
          <n-card>
            <div class="flex justify-center items-center h-32">
              <n-spin size="large" />
            </div>
          </n-card>
        </n-grid-item>
      </template>
      
      <template v-else-if="error">
        <n-grid-item>
          <n-card title="Error">
            <div class="text-red-500">{{ error }}</div>
            <n-button class="mt-4" @click="loadInvoice">Retry</n-button>
          </n-card>
        </n-grid-item>
      </template>
      
      <template v-else-if="invoice">
        <!-- Invoice Summary -->
        <n-grid-item>
          <n-card title="Invoice Summary" size="small">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500">Invoice No</div>
                <div class="font-medium">{{ invoice.invoice_no || invoiceId }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Date</div>
                <div class="font-medium">{{ formatDate(invoice.date) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Customer</div>
                <div class="font-medium">{{ invoice.customer?.full_name || 'Walk-in Customer' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Total Amount</div>
                <div class="font-medium">{{ formatCurrency(invoice.grand_total) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Payment Method</div>
                <div class="font-medium capitalize">{{ invoice.payment_method }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Payment Status</div>
                <div class="font-medium capitalize">{{ invoice.payment_status || 'Unknown' }}</div>
              </div>
            </div>
            
            <div class="mt-4">
              <h3 class="font-medium mb-2">Products</h3>
              <div class="border rounded overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(item, index) in invoice.items" :key="index">
                      <td class="px-3 py-2 whitespace-nowrap">
                        <div class="text-sm">{{ item.medicine?.name || 'Unknown Medicine' }}</div>
                        <div v-if="item.batch_id" class="text-xs text-gray-500">Batch: {{ item.batch_id }}</div>
                      </td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm">{{ item.quantity }}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm">{{ formatCurrency(item.price) }}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm">{{ formatCurrency(item.subtotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        
        <!-- Shipping Form -->
        <n-grid-item>
          <shipping-g-h-n-form 
            :invoice-id="invoiceId" 
            :invoice-items="invoice?.items || []"
            @created="handleShippingCreated" 
            @error="handleShippingError"
          />
        </n-grid-item>
      </template>
    </n-grid>
    
    <!-- Success notification -->
    <n-modal v-model:show="showSuccessModal">
      <n-card 
        title="Shipping Order Created Successfully" 
        class="w-full max-w-md"
        :bordered="false"
        size="huge"
        role="dialog" 
        aria-modal="true"
      >
        <div class="space-y-4">
          <div class="text-center">
            <n-icon size="48" color="green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z"/>
              </svg>
            </n-icon>
            
            <h3 class="text-lg font-medium mt-2">Shipping order has been created successfully!</h3>
            <p class="mt-1 text-sm text-gray-500">
              Your tracking code: <span class="font-bold">{{ shippingCode }}</span>
            </p>
          </div>
          
          <div class="text-center space-y-2">
            <p>You can track your order using the tracking code above.</p>
            <div class="flex gap-2 justify-center mt-4">
              <n-button @click="router.push(`/invoice/view/${invoiceId}`)">
                Back to Invoice
              </n-button>
              <n-button type="primary" @click="router.push('/shipping/track')">
                Track Order
              </n-button>
            </div>
          </div>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import ShippingGHNForm from '@/components/Shipping/GHNForm.vue';

const route = useRoute();
const router = useRouter();
const api = useApi();

// Invoice data
const invoiceId = computed(() => route.params.id);
const invoice = ref(null);
const loading = ref(true);
const error = ref('');

// Shipping success state
const showSuccessModal = ref(false);
const shippingCode = ref('');

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Load invoice data
const loadInvoice = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get(`/api/invoice/${invoiceId.value}`);
    
    if (response.status) {
      invoice.value = response.data;
      
      // Populate medicine details if needed
      if (invoice.value.items) {
        for (const item of invoice.value.items) {
          if (item.medicine && typeof item.medicine === 'string') {
            try {
              const medicineResponse = await api.get(`/api/medicine/${item.medicine}`);
              if (medicineResponse.status) {
                item.medicine = medicineResponse.data;
              }
            } catch (err) {
              console.error(`Error fetching medicine details for ${item.medicine}:`, err);
              // Set a default name if medicine details can't be fetched
              item.medicine = { name: 'Unknown Medicine' };
            }
          } else if (!item.medicine || !item.medicine.name) {
            // If medicine object is missing or doesn't have a name property
            item.medicine = { name: item.medicine_name || 'Unknown Medicine' };
          }
        }
      }
      
      console.log('Loaded invoice with items:', JSON.stringify(invoice.value.items));
    } else {
      error.value = response.message || 'Failed to load invoice data';
    }
  } catch (err) {
    console.error('Error loading invoice:', err);
    error.value = err.message || 'An error occurred while loading invoice data';
  } finally {
    loading.value = false;
  }
};

// Handle shipping created
const handleShippingCreated = (data) => {
  shippingCode.value = data.shipping_code;
  showSuccessModal.value = true;
};

// Handle shipping error
const handleShippingError = (err) => {
  error.value = err.message || 'An error occurred while creating shipping order';
};

// Load data on mount
onMounted(() => {
  loadInvoice();
});
</script> 