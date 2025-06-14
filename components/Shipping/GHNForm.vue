<template>
  <div class="ghn-shipping-form">
    <n-card title="Giao hàng qua GHN" size="small">
      <div class="space-y-4">
        <!-- Thông tin người nhận -->
        <div class="space-y-2">
          <h3 class="font-medium">Thông tin người nhận</h3>
          <n-form-item label="Họ và tên">
            <n-input v-model:value="formData.recipient_name" placeholder="Nhập họ tên người nhận" />
          </n-form-item>
          
          <n-form-item label="Số điện thoại">
            <n-input v-model:value="formData.recipient_phone" placeholder="Nhập số điện thoại" />
          </n-form-item>
        </div>
        
        <!-- Địa chỉ giao hàng -->
        <div class="space-y-2">
          <h3 class="font-medium">Địa chỉ giao hàng</h3>
          
          <n-form-item label="Tỉnh/Thành phố">
            <n-select
              v-model:value="formData.province_id"
              :options="provinces"
              placeholder="Chọn tỉnh/thành phố"
              @update:value="handleProvinceChange"
            />
          </n-form-item>
          
          <n-form-item label="Quận/Huyện">
            <n-select
              v-model:value="formData.district_id"
              :options="districts"
              placeholder="Chọn quận/huyện"
              :disabled="!formData.province_id"
              @update:value="handleDistrictChange"
            />
          </n-form-item>
          
          <n-form-item label="Phường/Xã">
            <n-select
              v-model:value="formData.ward_code"
              :options="wards"
              placeholder="Chọn phường/xã"
              :disabled="!formData.district_id"
              @update:value="calculateShippingFee"
            />
          </n-form-item>
          
          <n-form-item label="Địa chỉ chi tiết">
            <n-input v-model:value="formData.recipient_address" placeholder="Số nhà, tên đường..." />
          </n-form-item>
        </div>
        
        <!-- Thông tin sản phẩm -->
        <div class="space-y-2">
          <h3 class="font-medium">Thông tin sản phẩm</h3>
          
          <n-form-item label="Trọng lượng (gram)">
            <n-input-number v-model:value="formData.weight" :min="100" @update:value="calculateShippingFee" />
          </n-form-item>
          
          <n-form-item label="Dịch vụ vận chuyển">
            <n-select
              v-model:value="formData.service_id"
              :options="[
                { label: 'GHN Express', value: 53320 },
                { label: 'GHN Nhanh', value: 53321 }
              ]"
              placeholder="Chọn dịch vụ vận chuyển"
              @update:value="calculateShippingFee"
            />
          </n-form-item>
          
          <div class="mb-2">
            <n-button size="small" @click="testGHNConnection" :loading="testingConnection">
              Kiểm tra kết nối GHN
            </n-button>
          </div>
          
          <div class="shipping-fee p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <div class="flex justify-between items-center">
              <span>Phí vận chuyển:</span>
              <span class="font-medium">{{ loading ? 'Đang tính...' : (shippingFee ? formatCurrency(shippingFee) : 'Chưa xác định') }}</span>
            </div>
            <div v-if="shippingFee" class="flex justify-between items-center mt-1">
              <span>Thời gian giao hàng dự kiến:</span>
              <span class="font-medium">{{ expectedDeliveryTime || 'Chưa xác định' }}</span>
            </div>
          </div>
          
          <div v-if="error" class="text-red-500 text-sm mt-2">
            {{ errorMessage }}
          </div>
        </div>
        
        <n-divider />
        
        <!-- Button tạo đơn vận chuyển -->
        <div class="flex justify-end">
          <n-button 
            type="primary" 
            :loading="submitting"
            :disabled="!isFormValid || submitting"
            @click="createShippingOrder">
            Tạo đơn vận chuyển
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  invoiceId: {
    type: String,
    required: true
  },
  invoiceItems: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['created', 'error']);

// API client
const api = useApi();

// Form data
const formData = ref({
  invoice: props.invoiceId,
  recipient_name: '',
  recipient_phone: '',
  province_id: null,
  district_id: null,
  ward_code: '',
  recipient_address: '',
  weight: 500,
  length: 10,
  width: 10,
  height: 10,
  service_id: 53320
});

// Options for select dropdowns
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

// Shipping information
const shippingFee = ref(0);
const expectedDeliveryTime = ref('');

// UI states
const loading = ref(false);
const submitting = ref(false);
const error = ref(false);
const errorMessage = ref('');
const testingConnection = ref(false);

// Phone validation
const phoneRegex = /^0\d{9}$/;

// Form validation
const isFormValid = computed(() => {
  return formData.value.recipient_name && 
    phoneRegex.test(formData.value.recipient_phone) &&
    formData.value.province_id && 
    formData.value.district_id && 
    formData.value.ward_code && 
    formData.value.recipient_address &&
    shippingFee.value > 0;
});

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Load provinces on component mount
onMounted(async () => {
  try {
    const response = await api.get('/api/shipping/provinces');
    if (response.status && response.data) {
      provinces.value = response.data.map(province => ({
        label: province.ProvinceName,
        value: province.ProvinceID
      }));
    }
  } catch (err) {
    console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', err);
    showError('Không thể lấy danh sách tỉnh/thành phố');
  }
});

// Handle province change
const handleProvinceChange = async (value) => {
  districts.value = [];
  wards.value = [];
  formData.value.district_id = null;
  formData.value.ward_code = '';
  
  if (value) {
    try {
      const response = await api.get(`/api/shipping/districts?province_id=${value}`);
      if (response.status && response.data) {
        districts.value = response.data.map(district => ({
          label: district.DistrictName,
          value: district.DistrictID
        }));
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách quận/huyện:', err);
      showError('Không thể lấy danh sách quận/huyện');
    }
  }
};

// Handle district change
const handleDistrictChange = async (value) => {
  wards.value = [];
  formData.value.ward_code = '';
  
  if (value) {
    try {
      const response = await api.get(`/api/shipping/wards?district_id=${value}`);
      if (response.status && response.data) {
        wards.value = response.data.map(ward => ({
          label: ward.WardName,
          value: ward.WardCode
        }));
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách phường/xã:', err);
      showError('Không thể lấy danh sách phường/xã');
    }
  }
};

// Calculate shipping fee
const calculateShippingFee = async () => {
  if (formData.value.ward_code && formData.value.district_id) {
    loading.value = true;
    error.value = false;
    
    try {
      const payload = {
        service_id: formData.value.service_id,
        district_id: formData.value.district_id,
        ward_code: formData.value.ward_code,
        weight: formData.value.weight,
        length: formData.value.length,
        width: formData.value.width,
        height: formData.value.height
      };
      
      const response = await api.post('/api/shipping/calculate-fee', payload);
      if (response.status && response.data) {
        shippingFee.value = response.data.total || 0;
        expectedDeliveryTime.value = response.data.expected_delivery_time || '';
      } else {
        showError('Lỗi khi tính phí vận chuyển');
      }
    } catch (err) {
      console.error('Lỗi khi tính phí vận chuyển:', err);
      showError('Không thể tính phí vận chuyển');
    } finally {
      loading.value = false;
    }
  }
};

// Create shipping order
const createShippingOrder = async () => {
  if (!isFormValid.value) {
    if (!phoneRegex.test(formData.value.recipient_phone)) {
      showError('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0');
    }
    return;
  }
  
  submitting.value = true;
  error.value = false;
  
  try {
    const response = await api.post('/api/shipping', formData.value);
    if (response.status) {
      emit('created', response.data);
    } else {
      throw new Error(response.message || 'Lỗi khi tạo đơn vận chuyển');
    }
  } catch (err) {
    console.error('Lỗi khi tạo đơn vận chuyển:', err);
    showError('Không thể tạo đơn vận chuyển: ' + (err.message || ''));
    emit('error', err);
  } finally {
    submitting.value = false;
  }
};

// Show error message
const showError = (message) => {
  error.value = true;
  errorMessage.value = message;
};

// Test GHN connection
const testGHNConnection = async () => {
  testingConnection.value = true;
  error.value = false;
  
  try {
    const response = await api.get('/api/shipping/test-connection');
    if (response.status) {
      showSuccess('Kết nối GHN thành công');
    } else {
      throw new Error(response.message || 'Lỗi khi kiểm tra kết nối GHN');
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra kết nối GHN:', err);
    showError('Không thể kiểm tra kết nối GHN');
  } finally {
    testingConnection.value = false;
  }
};

// Show success message
const showSuccess = (message) => {
  // Implement the logic to show a success message to the user
  console.log(message);
};
</script>

<style scoped>
.shipping-fee {
  margin-top: 1rem;
}
</style> 