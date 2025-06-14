<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/')">
          Home
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          Track Order
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Track Order</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Check the status of your order through GHN
        </p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <track-order />
      </div>
      
      <div>
        <n-card title="Recent Orders" size="small">
          <n-spin v-if="loading" />
          
          <template v-else>
            <div v-if="shippings.length === 0" class="text-center py-8">
              <p class="text-gray-500">No recent orders</p>
            </div>
            
            <div v-else class="space-y-4">
              <div v-for="(shipping, index) in shippings" :key="index" class="border-b pb-3 last:border-0">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-medium">Tracking Code: {{ shipping.shipping_code }}</h3>
                    <p class="text-sm text-gray-500">Created: {{ formatDate(shipping.created_at) }}</p>
                  </div>
                  <n-tag :type="getStatusType(shipping.status)">
                    {{ getStatusText(shipping.status) }}
                  </n-tag>
                </div>
                
                <div class="mt-2 flex justify-between items-center">
                  <div class="text-sm">
                    <div>Recipient: {{ shipping.recipient_name }}</div>
                    <div class="text-gray-500">{{ formatCurrency(shipping.shipping_fee) }}</div>
                  </div>
                  <n-button size="small" @click="copyToClipboard(shipping.shipping_code)">
                    Copy code
                  </n-button>
                </div>
              </div>
            </div>
          </template>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useMessage } from 'naive-ui';
import TrackOrder from '@/components/Shipping/TrackOrder.vue';

const router = useRouter();
const api = useApi();
const message = useMessage();

const shippings = ref([]);
const loading = ref(true);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  }).format(date);
};

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'shipping': 'Shipping',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
};

// Get status type (color)
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'info',
    'confirmed': 'info',
    'shipping': 'warning',
    'delivered': 'success',
    'cancelled': 'error'
  };
  
  return typeMap[status] || 'default';
};

// Copy tracking code to clipboard
const copyToClipboard = async (code) => {
  try {
    await navigator.clipboard.writeText(code);
    message.success('Tracking code copied');
  } catch (err) {
    console.error('Error copying:', err);
    message.error('Could not copy tracking code');
  }
};

// Fetch recent shipments
const fetchRecentShippings = async () => {
  try {
    const response = await api.get('/api/shipping?limit=5');
    
    if (response.status && response.data) {
      shippings.value = response.data;
    }
  } catch (err) {
    console.error('Error fetching shipping list:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRecentShippings();
});
</script> 