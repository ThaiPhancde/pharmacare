<template>
  <div>
    <n-card title="Theo dõi đơn hàng GHN" size="small">
      <div class="space-y-4">
        <!-- Form nhập mã vận đơn -->
        <div class="flex gap-2">
          <n-input 
            v-model:value="orderCode" 
            placeholder="Nhập mã vận đơn" 
            :disabled="loading" 
            @keyup.enter="trackOrder" 
          />
          <n-button :loading="loading" :disabled="!orderCode" @click="trackOrder">
            Tra cứu
          </n-button>
        </div>
        
        <!-- Hiển thị thông tin đơn hàng -->
        <div v-if="trackingData" class="tracking-info space-y-4">
          <div class="basic-info space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium">Mã vận đơn:</span>
              <span>{{ trackingData.order_code }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Trạng thái:</span>
              <n-tag :type="getStatusType(trackingData.status)">
                {{ getStatusText(trackingData.status) }}
              </n-tag>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Dự kiến giao hàng:</span>
              <span>{{ formatDate(trackingData.expected_delivery_time) }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="font-medium">Phí vận chuyển:</span>
              <span>{{ formatCurrency(trackingData.total_fee) }}</span>
            </div>
          </div>
          
          <n-divider />
          
          <!-- Thông tin người nhận -->
          <div class="recipient-info space-y-1">
            <h3 class="font-medium">Thông tin người nhận</h3>
            <p><strong>Họ tên:</strong> {{ trackingData.to_name }}</p>
            <p><strong>Số điện thoại:</strong> {{ trackingData.to_phone }}</p>
            <p><strong>Địa chỉ:</strong> {{ trackingData.to_address }}</p>
          </div>
          
          <n-divider />
          
          <!-- Lịch sử trạng thái -->
          <div class="status-history">
            <h3 class="font-medium mb-2">Lịch sử trạng thái</h3>
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
        
        <!-- Thông báo lỗi -->
        <div v-if="error" class="text-red-500 text-sm">
          {{ errorMessage }}
        </div>
        
        <!-- Trạng thái chưa có dữ liệu -->
        <div v-if="!trackingData && !loading && !error" class="empty-state text-center py-4">
          <p class="text-gray-500">Nhập mã vận đơn để theo dõi trạng thái đơn hàng</p>
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

// Lấy text trạng thái
const getStatusText = (status) => {
  const statusMap = {
    'ready_to_pick': 'Sẵn sàng lấy hàng',
    'picking': 'Đang lấy hàng',
    'picked': 'Đã lấy hàng',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'delivery_failed': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ trả hàng',
    'return': 'Đang trả hàng',
    'returned': 'Đã trả hàng',
    'cancelled': 'Đã hủy'
  };
  
  return statusMap[status] || status;
};

// Lấy loại trạng thái (màu sắc)
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
      errorMessage.value = response.message || 'Không tìm thấy thông tin đơn hàng';
      trackingData.value = null;
    }
  } catch (err) {
    console.error('Lỗi khi tra cứu đơn hàng:', err);
    error.value = true;
    errorMessage.value = 'Không thể tra cứu đơn hàng: ' + (err.message || '');
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