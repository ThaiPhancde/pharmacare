<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/invoice')">
          Hóa đơn
        </n-breadcrumb-item>
        <n-breadcrumb-item @click="router.push(`/invoice/view/${invoiceId}`)">
          Chi tiết hóa đơn
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          Giao hàng
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Giao hàng qua GHN</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Thiết lập vận chuyển hóa đơn #{{ invoiceId }}
        </p>
      </div>
      
      <div class="flex gap-2">
        <n-button @click="router.push(`/invoice/view/${invoiceId}`)">Quay lại</n-button>
      </div>
    </div>
    
    <n-grid :cols="1" :x-gap="12" :y-gap="12">
      <n-grid-item v-if="loading">
        <n-card>
          <n-spin size="large" />
        </n-card>
      </n-grid-item>
      
      <template v-else>
        <!-- Thông tin hóa đơn -->
        <n-grid-item>
          <n-card title="Thông tin đơn hàng" size="small">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span>Mã hóa đơn:</span>
                <span class="font-medium">{{ invoice?.invoice_no || invoice?._id }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span>Khách hàng:</span>
                <span class="font-medium">{{ customerName }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span>Ngày tạo:</span>
                <span>{{ formatDate(invoice?.date) }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span>Tổng tiền:</span>
                <span class="font-bold">{{ formatCurrency(invoice?.grand_total) }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span>Số mặt hàng:</span>
                <span>{{ invoice?.items?.length || 0 }}</span>
              </div>
            </div>
            
            <n-divider />
            
            <div class="space-y-1">
              <h3 class="font-medium mb-2">Các sản phẩm</h3>
              <div v-for="(item, index) in invoice?.items" :key="index" class="flex justify-between items-center">
                <span>{{ item.medicine_name || 'Thuốc' }} x{{ item.quantity }}</span>
                <span>{{ formatCurrency(item.subtotal) }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        
        <!-- Form vận chuyển -->
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
    
    <!-- Thông báo thành công -->
    <n-modal v-model:show="showSuccessModal">
      <n-card 
        title="Tạo đơn vận chuyển thành công" 
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
            
            <h3 class="text-lg font-medium mt-2">Đơn vận chuyển đã được tạo thành công!</h3>
            <p class="mt-1 text-sm text-gray-500">
              Mã vận đơn của bạn: <span class="font-bold">{{ shippingCode }}</span>
            </p>
          </div>
          
          <div class="text-center space-y-2">
            <p>Bạn có thể theo dõi đơn hàng bằng mã vận đơn trên.</p>
            <div class="flex gap-2 justify-center mt-4">
              <n-button @click="router.push(`/invoice/view/${invoiceId}`)">
                Quay lại hóa đơn
              </n-button>
              <n-button type="primary" @click="router.push('/shipping/track')">
                Theo dõi đơn hàng
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
import { useMessage } from 'naive-ui';
import ShippingGHNForm from '@/components/Shipping/GHNForm.vue';

const route = useRoute();
const router = useRouter();
const api = useApi();
const message = useMessage();

const invoiceId = ref(route.params.id);
const invoice = ref(null);
const customer = ref(null);
const loading = ref(true);

const showSuccessModal = ref(false);
const shippingCode = ref('');

// Tính toán tên khách hàng
const customerName = computed(() => {
  if (!customer.value) return 'Khách lẻ';
  return customer.value.full_name || `${customer.value.contact_info?.phone || 'Khách hàng'}`;
});

// Format tiền tệ
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

// Lấy thông tin hóa đơn
const fetchInvoice = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/api/invoice/${invoiceId.value}`);
    
    if (response.status && response.data) {
      invoice.value = response.data;
      
      // Lấy thông tin khách hàng nếu có
      if (invoice.value.customer) {
        await fetchCustomer(invoice.value.customer);
      }
    } else {
      message.error('Không thể lấy thông tin hóa đơn');
      router.push('/invoice');
    }
  } catch (err) {
    console.error('Lỗi khi lấy thông tin hóa đơn:', err);
    message.error('Không thể lấy thông tin hóa đơn');
    router.push('/invoice');
  } finally {
    loading.value = false;
  }
};

// Lấy thông tin khách hàng
const fetchCustomer = async (customerId) => {
  try {
    const response = await api.get(`/api/customers/${customerId}`);
    
    if (response.status && response.data) {
      customer.value = response.data;
    }
  } catch (err) {
    console.error('Lỗi khi lấy thông tin khách hàng:', err);
  }
};

// Xử lý khi tạo vận chuyển thành công
const handleShippingCreated = (data) => {
  shippingCode.value = data.shipping_code;
  showSuccessModal.value = true;
};

// Xử lý khi có lỗi tạo vận chuyển
const handleShippingError = (error) => {
  message.error(`Lỗi khi tạo đơn vận chuyển: ${error.message || 'Đã xảy ra lỗi'}`);
};

// Lấy dữ liệu khi component được tạo
onMounted(() => {
  fetchInvoice();
});
</script> 