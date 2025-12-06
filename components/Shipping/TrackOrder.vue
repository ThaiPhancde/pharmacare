<template>
  <div>
    <n-card title="Track GHN Delivery" size="small">
      <div class="space-y-4">
        <!-- Order code input form -->
        <div class="flex gap-2">
          <n-input 
            v-model:value="orderCode" 
            placeholder="Enter tracking code" 
            :disabled="loading" 
            @keyup.enter="trackOrder" 
          />
          <n-button :loading="loading" :disabled="!orderCode" @click="trackOrder" type="primary" strong>
            Track
          </n-button>
        </div>
        
        <!-- Display order information -->
        <div v-if="trackingData" class="tracking-info space-y-4">
          <div class="basic-info space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium">Tracking Code:</span>
              <span>{{ trackingData.order_code }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Status:</span>
              <n-tag :type="getStatusType(trackingData.status)" bordered="false">
                {{ getStatusText(trackingData.status) }}
              </n-tag>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Expected Delivery:</span>
              <span>{{ formatDate(trackingData.expected_delivery_time) }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Shipping Fee:</span>
              <span>{{ formatCurrency(trackingData.total_fee) }}</span>
            </div>
          </div>
          
          <n-divider />
          
          <!-- Recipient information -->
          <div class="recipient-info space-y-1">
            <h3 class="font-medium">Recipient Information</h3>
            <p><strong>Full name:</strong> {{ trackingData.to_name }}</p>
            <p><strong>Phone number:</strong> {{ trackingData.to_phone }}</p>
            <p><strong>Address:</strong> {{ trackingData.to_address }}</p>
          </div>
          
          <n-divider />
          
          <!-- Status history -->
          <div class="status-history">
            <h3 class="font-medium mb-2">Status History</h3>
            <n-timeline>
              <n-timeline-item 
                v-for="(status, index) in trackingData.status_history" 
                :key="index"
                :type="getStatusType(status.status)"
              >
                <template #content>
                  <div class="timeline-content">
                    <p class="font-medium">{{ getStatusText(status.status) }}</p>
                    <p class="text-sm text-gray-500">{{ formatDateTime(status.timestamp) }}</p>
                  </div>
                </template>
              </n-timeline-item>
            </n-timeline>
          </div>
        </div>
        
        <!-- Error notification -->
        <div v-if="error" class="text-red-500 text-sm">
          {{ errorMessage }}
        </div>
        
        <!-- Empty state -->
        <div v-if="!trackingData && !loading && !error" class="empty-state text-center py-4">
          <p class="text-gray-500">Enter a tracking code to see your delivery status</p>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

// API client
const api = useApi();

// Trạng thái
const orderCode = ref('');
const trackingData = ref(null);
const loading = ref(false);
const error = ref(false);
const errorMessage = ref('');

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

// Format datetime
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'ready_to_pick': 'Ready for pickup',
    'picking': 'Picking up',
    'picked': 'Picked up',
    'delivering': 'Delivering',
    'delivered': 'Delivered',
    'delivery_failed': 'Delivery failed',
    'waiting_to_return': 'Waiting for return',
    'return': 'Returning',
    'returned': 'Returned',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
};

// Get status type (color)
const getStatusType = (status) => {
  const typeMap = {
    'ready_to_pick': 'info',
    'picking': 'info',
    'picked': 'success',
    'delivering': 'warning',
    'delivered': 'success',
    'delivery_failed': 'error',
    'waiting_to_return': 'warning',
    'return': 'warning',
    'returned': 'info',
    'cancelled': 'error'
  };
  
  return typeMap[status] || 'default';
};

// Track order
const trackOrder = async () => {
  if (!orderCode.value) return;
  
  loading.value = true;
  error.value = false;
  errorMessage.value = '';
  
  try {
    const response = await api.get(`/api/shipping/track?order_code=${orderCode.value}`);
    
    if (response.status && response.data) {
      trackingData.value = response.data;
    } else {
      error.value = true;
      errorMessage.value = response.message || 'Order information not found';
      trackingData.value = null;
    }
  } catch (err) {
    console.error('Error tracking order:', err);
    error.value = true;
    errorMessage.value = 'Cannot track order: ' + (err.message || '');
    trackingData.value = null;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.timeline-content {
  margin-top: -0.5rem;
}
</style> 