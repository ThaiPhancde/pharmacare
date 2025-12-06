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
          
          <n-form-item label="Address Details">
            <n-input v-model:value="formData.recipient_address" placeholder="House number, street name..." />
          </n-form-item>
        </div>
        
        <!-- Thông tin sản phẩm -->
        <div class="space-y-2">
          <h3 class="font-medium">Product Information</h3>
          
          <n-form-item label="Weight (grams)">
            <n-input-number v-model:value="formData.weight" :min="100" @update:value="calculateShippingFee" />
          </n-form-item>
          
          <n-form-item label="Shipping Service">
            <n-select
              v-model:value="formData.service_id"
              :options="[
                { label: 'GHN Express', value: 53320 },
                { label: 'GHN Fast', value: 53321 }
              ]"
              placeholder="Select shipping service"
              @update:value="calculateShippingFee"
            />
          </n-form-item>
          
          <!-- Payment Method -->
          <n-form-item label="Payment Method">
            <n-radio-group v-model:value="formData.payment_method" @update:value="handlePaymentMethodChange">
              <n-space>
                <n-radio value="prepaid">Prepaid (Only shipping fee)</n-radio>
                <n-radio value="cod">COD (Cash on Delivery)</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          
          <div class="mb-2">
            <n-button size="small" @click="testGHNConnection" :loading="testingConnection">
              Test GHN Connection
            </n-button>
          </div>
          
          <div class="shipping-fee p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <div class="flex justify-between items-center">
              <span>Shipping Fee:</span>
              <span class="font-medium">{{ loading ? 'Calculating...' : (shippingFee ? formatCurrency(shippingFee) : 'Not determined') }}</span>
            </div>
            <div v-if="formData.payment_method === 'cod'" class="flex justify-between items-center mt-1">
              <span>Product Amount:</span>
              <span class="font-medium">{{ formatCurrency(invoiceAmount) }}</span>
            </div>
            <div v-if="formData.payment_method === 'cod'" class="flex justify-between items-center mt-1">
              <span>Total COD Amount:</span>
              <span class="font-medium">{{ formatCurrency(codAmount) }}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span>Expected Delivery Time:</span>
              <span class="font-medium">{{ loading ? 'Calculating...' : (expectedDeliveryTime || 'Not determined') }}</span>
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
            Create Shipping Order
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
  service_id: 53320,
  payment_method: 'prepaid',
  is_cod: false,
  cod_amount: 0
});

// Options for select dropdowns
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

// Shipping information
const shippingFee = ref(0);
const expectedDeliveryTime = ref('');
const invoiceAmount = ref(0);
const codAmount = computed(() => {
  return shippingFee.value + (formData.value.is_cod ? invoiceAmount.value : 0);
});

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
    
    // Get invoice details to calculate total amount
    const invoiceResponse = await api.get(`/api/invoice/${props.invoiceId}`);
    if (invoiceResponse.status && invoiceResponse.data) {
      invoiceAmount.value = invoiceResponse.data.grand_total || 0;
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

// Handle payment method change
const handlePaymentMethodChange = (value) => {
  formData.value.is_cod = value === 'cod';
  formData.value.cod_amount = value === 'cod' ? invoiceAmount.value : 0;
};

// Calculate shipping fee
const calculateShippingFee = async () => {
  if (formData.value.ward_code && formData.value.district_id) {
    loading.value = true;
    error.value = false;
    errorMessage.value = '';
    
    // Set default value for expected delivery time
    // HCM city districts are in range 1442-1480
    const isHCMCity = formData.value.district_id >= 1442 && formData.value.district_id <= 1480;
    if (isHCMCity) {
      expectedDeliveryTime.value = 'Trong ngày (3-5 tiếng)';
      // Set a default shipping fee for HCM city in case API fails
      shippingFee.value = 20500; // Default fee for HCM
    } else {
      expectedDeliveryTime.value = '1-3 ngày';
      // Default fee for other locations
      shippingFee.value = 30000; // Default fee for other locations
    }
    
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
      if (response.status && response.data && response.data.total) {
        shippingFee.value = response.data.total;
        if (response.data.expected_delivery_time) {
          expectedDeliveryTime.value = response.data.expected_delivery_time;
        }
        console.log('Expected delivery time:', response.data.expected_delivery_time);
        console.log('Raw leadtime:', response.data.raw_leadtime);
      } else if (response.status === false) {
        // If calculation failed but we have data with expected_delivery_time
        if (response.data && response.data.expected_delivery_time) {
          expectedDeliveryTime.value = response.data.expected_delivery_time;
        }
        // Use the default fee we set earlier
        console.log('Using default shipping fee:', shippingFee.value);
        // Show a warning but don't treat it as an error since we have a default fee
        console.warn('Lỗi khi tính phí vận chuyển từ GHN, sử dụng phí mặc định:', response.message);
      }
    } catch (err) {
      console.error('Lỗi khi tính phí vận chuyển:', err);
      // Don't show error to user since we're using default values
      console.warn('Sử dụng phí vận chuyển mặc định:', shippingFee.value);
    } finally {
      loading.value = false;
    }
  } else {
    // If district or ward is not selected, reset values
    shippingFee.value = 0;
    expectedDeliveryTime.value = '';
  }
};

// Create shipping order
const createShippingOrder = async () => {
  if (!isFormValid.value) {
    if (!phoneRegex.test(formData.value.recipient_phone)) {
      showError('Phone number must be 10 digits and start with 0');
    }
    return;
  }
  
  submitting.value = true;
  error.value = false;
  
  try {
    // Add COD amount if payment method is COD
    const requestData = { ...formData.value };
    if (requestData.payment_method === 'cod') {
      requestData.cod_amount = invoiceAmount.value;
    }
    
    const response = await api.post('/api/shipping', requestData);
    if (response.status) {
      emit('created', response.data);
    } else {
      throw new Error(response.message || 'Error creating shipping order');
    }
  } catch (err) {
    console.error('Error creating shipping order:', err);
    showError('Cannot create shipping order: ' + (err.message || ''));
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
      showSuccess('GHN connection successful');
    } else {
      throw new Error(response.message || 'Error checking GHN connection');
    }
  } catch (err) {
    console.error('Error checking GHN connection:', err);
    showError('Cannot check GHN connection');
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