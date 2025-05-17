<template>
  <div class="flex flex-col md:flex-row h-screen gap-4 p-4">
    <!-- Left section - Product selection -->
    <div class="w-full md:w-2/3 flex flex-col gap-4">
      <!-- Search and category filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative">
          <n-input type="text" placeholder="Tìm kiếm thuốc..." v-model:value="searchQuery" />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2">
          <n-button 
            v-for="category in categories" 
            :key="category.id"
            :type="activeCategory === category.id ? 'primary' : 'default'"
            @click="setActiveCategory(category.id)"
            class="whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200"
            :class="{ 'bg-blue-600 text-white hover:bg-blue-700': activeCategory === category.id }"
          >
            {{ category.name }}
          </n-button>
        </div>
      </div>
      
      <!-- Medicine grid -->
      <n-card class="flex-1 overflow-y-auto">
        <div 
          v-if="loading" 
          class="flex justify-center items-center h-full"
        >
          <n-spin size="large" />
        </div>
        <div
          v-else-if="filteredMedicines.length === 0" 
          class="flex justify-center items-center h-full text-gray-500"
        >
          Không tìm thấy thuốc nào
        </div>
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <n-card
            v-for="medicine in filteredMedicines"
            :key="medicine._id"
            class="cursor-pointer hover:border-primary transition-colors"
            @click="addToCart(medicine)"
            size="small"
          >
            <div class="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
              <img
                :src="medicine.image || '/medicine-placeholder.png'"
                :alt="medicine.name"
                class="object-cover w-full h-full"
              />
            </div>
            <h3 class="font-medium text-sm leading-tight mb-1 truncate">{{ medicine.name }}</h3>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">{{ medicine.category?.name || 'N/A' }}</span>
              <span class="text-xs font-semibold">{{ formatCurrency(medicine.price) }}</span>
            </div>
          </n-card>
        </div>
      </n-card>
    </div>
    
    <!-- Right section - Cart and checkout -->
    <div class="w-full md:w-1/3 flex flex-col gap-4">
      <!-- Customer selection -->
      <n-card size="small">
        <h3 class="font-medium mb-2">Khách hàng</h3>
        <n-select 
          v-model:value="selectedCustomer" 
          :options="customers" 
          placeholder="Khách lẻ" 
          clearable
        />
      </n-card>
      
      <!-- Cart items -->
      <n-card title="Giỏ hàng" size="small" class="flex-1 overflow-y-auto">
        <div v-if="cart.length === 0" class="flex justify-center items-center h-32 text-gray-500">
          Giỏ hàng trống
        </div>
        <div v-else class="space-y-3">
          <div v-for="(item, index) in cart" :key="index" class="flex items-center justify-between border-b border-gray-200 pb-2">
            <div class="flex-1">
              <div class="font-medium text-sm">{{ item.name }}</div>
              <div class="text-xs text-gray-500">
                {{ formatCurrency(item.price) }} × {{ item.quantity }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ formatCurrency(item.price * item.quantity) }}</span>
              <n-button quaternary circle size="small" @click="removeItem(index)">
                <template #icon>
                  <Trash class="h-4 w-4 text-red-500" />
                </template>
              </n-button>
            </div>
          </div>
        </div>
      </n-card>
      
      <!-- Checkout summary -->
      <n-card size="small" class="space-y-2">
        <div class="flex justify-between items-center">
          <span>Tạm tính</span>
          <span>{{ formatCurrency(subtotal) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>VAT</span>
          <span>{{ formatCurrency(vatTotal) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Giảm giá</span>
          <div class="flex items-center gap-2">
            <n-input-number 
              v-model:value="discount" 
              class="w-20" 
              size="small" 
              :min="0" 
              :max="subtotal + vatTotal"
            />
            <span>{{ formatCurrency(discount) }}</span>
          </div>
        </div>
        <n-divider />
        <div class="flex justify-between items-center font-bold">
          <span>Tổng cộng</span>
          <span>{{ formatCurrency(grandTotal) }}</span>
        </div>
      </n-card>
      
      <!-- Payment options -->
      <n-card size="small" class="space-y-2">
        <div class="flex justify-between items-center">
          <span>Thanh toán</span>
          <n-select 
            v-model:value="paymentMethod" 
            class="w-32" 
            size="small"
            :options="[
              { label: 'Tiền mặt', value: 'cash' },
              { label: 'Thẻ', value: 'card' },
              { label: 'Chuyển khoản', value: 'bank' }
            ]"
          />
        </div>
        <div class="flex justify-between items-center">
          <span>Số tiền trả</span>
          <n-input-number v-model:value="amountPaid" class="w-32" size="small" :min="0" />
        </div>
        <div class="flex justify-between items-center font-bold">
          <span>Tiền thừa</span>
          <span>{{ formatCurrency(change) }}</span>
        </div>
      </n-card>
      
      <!-- Action buttons -->
      <div class="flex gap-2">
        <n-button type="default" class="flex-1" @click="clearCart">Xóa hết</n-button>
        <n-button type="primary" class="flex-1" @click="processPayment" :disabled="!canCheckout">
          Hoàn thành
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { useMessage } from 'naive-ui';
import { api } from '@/utils/api';
import { Trash } from 'lucide-vue-next';

const message = useMessage();
const loading = ref(false);
const searchQuery = ref('');
const activeCategory = ref('all');
const categories = ref([
  { id: 'all', name: 'All' },
  { id: 'Antibiotics', name: 'Antibiotics' },
  { id: 'Painkillers', name: 'Pain killers' },
  { id: 'Antipyretics', name: 'Antipyretics' },
  { id: 'Vitamins', name: 'Vitamins' }
]);
const medicines = ref([]);
const customers = ref([]);
const selectedCustomer = ref(null);
const cart = ref([]);
const discount = ref(0);
const paymentMethod = ref('cash');
const amountPaid = ref(0);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0 
  }).format(value);
};

// Filter medicines by search and category
const filteredMedicines = computed(() => {
  let filtered = medicines.value;
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(med => 
      med.name.toLowerCase().includes(query) || 
      med.category?.name.toLowerCase().includes(query)
    );
  }
  
  // Filter by category
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(med => 
      med.category?.name === activeCategory.value
    );
  }
  
  return filtered;
});

// Cart calculations
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const vatTotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    return sum + (itemTotal * (item.vat || 10) / 100);
  }, 0);
});

const grandTotal = computed(() => {
  return subtotal.value + vatTotal.value - discount.value;
});

const change = computed(() => {
  return Math.max(0, Number(amountPaid.value) - grandTotal.value);
});

const canCheckout = computed(() => {
  return cart.value.length > 0 && Number(amountPaid.value) >= grandTotal.value;
});

// Set active category
const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
};

// Add medicine to cart
const addToCart = (medicine) => {
  // Kiểm tra nếu thuốc có stock
  if (!medicine.stocks || medicine.stocks.length === 0) {
    message.error(`${medicine.name} không có trong kho`);
    return;
  }
  
  // Chọn stock mới nhất và chưa hết hạn
  const validStocks = medicine.stocks.filter(stock => 
    stock.unit_quantity > 0 && 
    new Date(stock.expiry_date) > new Date()
  );
  
  if (validStocks.length === 0) {
    message.error(`${medicine.name} đã hết hàng hoặc hết hạn sử dụng`);
    return;
  }
  
  // Sắp xếp theo ngày hết hạn tăng dần (FIFO)
  validStocks.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const stock = validStocks[0];
  
  const existingItem = cart.value.find(item => 
    item._id === medicine._id && item.batch_id === stock.batch_id
  );
  
  if (existingItem) {
    if (existingItem.quantity < stock.unit_quantity) {
      existingItem.quantity += 1;
      message.success(`Thêm ${medicine.name} vào giỏ hàng`);
    } else {
      message.warning(`Không thể thêm nữa. Chỉ còn ${stock.unit_quantity} ${medicine.name} trong lô ${stock.batch_id}`);
    }
  } else {
    cart.value.push({
      _id: medicine._id,
      name: medicine.name,
      price: stock.mrp || medicine.price,
      vat: stock.vat || medicine.vat || 10,
      quantity: 1,
      batch_id: stock.batch_id,
      expiry_date: stock.expiry_date,
      max_quantity: stock.unit_quantity,
      stock_id: stock._id,
      purchase: stock.purchase
    });
    message.success(`Thêm ${medicine.name} vào giỏ hàng`);
  }
};

// Remove item from cart
const removeItem = (index) => {
  cart.value.splice(index, 1);
};

// Clear cart
const clearCart = () => {
  cart.value = [];
  discount.value = 0;
  amountPaid.value = 0;
  selectedCustomer.value = null;
};

// Process payment
const processPayment = async () => {
  if (cart.value.length === 0) {
    message.error('Giỏ hàng đang trống');
    return;
  }
  
  if (Number(amountPaid.value) < grandTotal.value) {
    message.error('Số tiền thanh toán ít hơn tổng cộng');
    return;
  }
  
  try {
    const invoiceData = {
      date: Date.now(),
      customer: selectedCustomer.value,
      items: cart.value.map(item => ({
        medicine: item._id,
        quantity: item.quantity,
        price: item.price,
        vat: item.vat,
        subtotal: item.price * item.quantity,
        batch_id: item.batch_id,
        expiry_date: item.expiry_date,
        purchase: item.purchase,
        stock_id: item.stock_id
      })),
      subtotal: subtotal.value,
      vat_total: vatTotal.value,
      discount: discount.value,
      grand_total: grandTotal.value,
      paid: Number(amountPaid.value),
      due: 0,
      payment_method: paymentMethod.value
    };
    
    // Submit invoice to POS API endpoint
    const response = await api.post('/api/invoice/pos', invoiceData);
    
    if (response && response.status) {
      message.success('Hoàn thành giao dịch thành công');
      clearCart();
    } else {
      message.error(response.error || 'Tạo hóa đơn thất bại');
    }
  } catch (error) {
    message.error(error.message || 'Đã xảy ra lỗi không mong muốn');
    console.error('POS Invoice error:', error);
  }
};

// Fetch medicines
const fetchMedicines = async () => {
  loading.value = true;
  try {
    // Lấy thuốc và populate thông tin stock
    const response = await api.get('/api/medicine', { 
      params: { 
        limit: 100,
        populate: 'stocks',
      } 
    });
    
    if (response && response.data) {
      medicines.value = response.data;
      
      // Extract unique categories
      const uniqueCategories = new Set(['all']);
      response.data.forEach(med => {
        if (med.category?.name) {
          uniqueCategories.add(med.category.name);
        }
      });
      
      categories.value = Array.from(uniqueCategories).map(cat => {
        return { id: cat, name: cat === 'all' ? 'All' : cat };
      });
    }
  } catch (error) {
    console.error('Failed to fetch medicines:', error);
    message.error('Không thể tải dữ liệu thuốc');
  } finally {
    loading.value = false;
  }
};

// Fetch customers
const fetchCustomers = async () => {
  try {
    const response = await api.get('/api/customers', { params: { limit: 100 } });
    if (response && response.data) {
      customers.value = response.data.map(item =>({label: item.full_name, value: item._id}));
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

onMounted(async () => {
  await Promise.all([fetchMedicines(), fetchCustomers()]);
});
</script> 