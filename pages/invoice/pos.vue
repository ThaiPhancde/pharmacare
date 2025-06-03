<template>
  <div class="flex flex-col md:flex-row h-screen gap-4 p-4">
    <!-- Left section - Product selection -->
    <div class="w-full md:w-2/3 flex flex-col gap-4">
      <!-- Barcode scanner -->
      <n-card size="small">
        <BarcodeScanner @decode="onBarcodeScanned" title="Scan Product Barcode" />
      </n-card>
      
      <!-- Search and category filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative">
          <n-input type="text" placeholder="Search medicines..." v-model:value="searchQuery" />
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
          No medicines found
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
            <!-- Add stock quantity information -->
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">Stock:</span>
              <span class="text-xs font-medium" :class="{'text-green-600': getMedicineAvailableStock(medicine) > 10, 'text-amber-600': getMedicineAvailableStock(medicine) > 0 && getMedicineAvailableStock(medicine) <= 10, 'text-red-600': getMedicineAvailableStock(medicine) === 0}">
                {{ getMedicineAvailableStock(medicine) }}
              </span>
            </div>
          </n-card>
        </div>
      </n-card>
    </div>
    
    <!-- Right section - Cart and checkout -->
    <div class="w-full md:w-1/3 flex flex-col gap-4">
      <!-- Customer selection -->
      <n-card size="small">
        <h3 class="font-medium mb-2">Customer</h3>
        <n-select 
          v-model:value="selectedCustomer" 
          :options="customers" 
          placeholder="Walk-in Customer" 
          clearable
        />
      </n-card>
      
      <!-- Cart items -->
      <n-card title="Cart" size="small" class="flex-1 overflow-y-auto">
        <div v-if="cart.length === 0" class="flex justify-center items-center h-32 text-gray-500">
          Cart is empty
        </div>
        <div v-else class="space-y-3">
          <div v-for="(item, index) in cart" :key="index" class="flex flex-col border-b border-gray-200 pb-2">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="font-medium text-sm">{{ item.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatCurrency(item.price) }} × 
                  <n-input-number 
                    v-model:value="item.quantity" 
                    size="small" 
                    :min="1" 
                    :max="item.max_quantity" 
                    @update:value="updateCartTotal"
                    class="inline-block w-16"
                  />
                </div>
                <div class="text-xs text-amber-600">
                  Stock: {{ item.max_quantity }}
                </div>
                <!-- Display discount information if applicable -->
                <div v-if="item.discount_percentage > 0" class="text-xs text-green-600">
                  {{ item.discount_percentage }}% discount ({{ item.discount_reason }})
                  <span class="line-through text-gray-500 ml-1">{{ formatCurrency(item.original_price) }}</span>
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
        </div>
      </n-card>
      
      <!-- Checkout summary -->
      <n-card size="small" class="space-y-2">
        <div class="flex justify-between items-center">
          <span>Subtotal</span>
          <span>{{ formatCurrency(subtotal) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>VAT</span>
          <span>{{ formatCurrency(vatTotal) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Discount</span>
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
          <span>Total</span>
          <span>{{ formatCurrency(grandTotal) }}</span>
        </div>
      </n-card>
      
      <!-- Payment options -->
      <n-card size="small" class="space-y-2">
        <div class="flex justify-between items-center">
          <span>Payment Method</span>
          <n-select 
            v-model:value="paymentMethod" 
            class="w-32" 
            size="small"
            :options="[
              { label: 'Cash', value: 'cash' },
              { label: 'Card', value: 'card' },
              { label: 'Bank Transfer', value: 'bank' }
            ]"
          />
        </div>
        
        <!-- Cash payment -->
        <template v-if="paymentMethod === 'cash'">
          <div class="flex justify-between items-center">
            <span>Amount Paid</span>
            <n-input-number v-model:value="amountPaid" class="w-32" size="small" :min="0" />
          </div>
          <div v-if="change > 0" class="flex justify-between items-center font-bold text-green-600">
            <span>Change</span>
            <span>{{ formatCurrency(change) }}</span>
          </div>
        </template>
        
        <!-- Card payment -->
        <template v-else-if="paymentMethod === 'card'">
          <div class="border border-gray-200 rounded p-4 bg-gray-50">
            <p class="text-sm text-center text-gray-500 mb-2">Please provide card information</p>
            <div class="flex flex-col gap-2">
              <div class="flex items-center">
                <span class="w-24 text-xs">Card Holder</span>
                <n-input v-model:value="cardInfo.name" size="small" placeholder="Enter cardholder name" />
              </div>
              <div class="flex items-center">
                <span class="w-24 text-xs">Card Number</span>
                <n-select v-model:value="cardInfo.number" size="small" placeholder="Select test card" :options="testCardOptions" />
              </div>
              <div class="flex items-center">
                <span class="w-24 text-xs">Expiry Date</span>
                <div class="flex gap-1">
                  <n-select v-model:value="cardInfo.expMonth" size="small" placeholder="MM" class="w-16" :options="monthOptions" />
                  <span>/</span>
                  <n-select v-model:value="cardInfo.expYear" size="small" placeholder="YY" class="w-16" :options="yearOptions" />
                </div>
              </div>
              <div class="flex items-center">
                <span class="w-24 text-xs">CVV</span>
                <n-input v-model:value="cardInfo.cvv" size="small" placeholder="XXX" class="w-16" />
              </div>
            </div>
            <div class="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-600">
              Test cards are provided by PayPal Sandbox. Select any card to test payment.
            </div>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span>Full Payment</span>
            <span class="font-bold">{{ formatCurrency(grandTotal) }}</span>
          </div>
          <n-button 
            type="primary" 
            class="w-full mt-2"
            :disabled="!cardInfo.name || !cardInfo.number || !cardInfo.expMonth || !cardInfo.expYear || !cardInfo.cvv"
            @click="processCardPayment"
          >
            Pay
          </n-button>
        </template>
        
        <!-- Bank transfer -->
        <template v-else-if="paymentMethod === 'bank'">
          <div class="border border-gray-200 rounded p-4 bg-gray-50 flex flex-col items-center">
            <h3 class="font-medium text-lg mb-1">Payment Information</h3>
            <p class="text-sm text-center mb-4">Scan QR code to make payment</p>
            
            <div class="bg-white p-3 rounded shadow-sm mb-4">
              <h4 class="text-blue-600 font-medium mb-2">Techcombank</h4>
              <div class="flex justify-center mb-2">
                <img :src="selectedBank?.qr_image || '/techcom-qr.png'" alt="Bank QR Code" class="w-48 h-48" />
              </div>
            </div>
            
            <div class="w-full">
              <div class="flex justify-between py-2 border-b">
                <span class="font-medium">Account Name:</span>
                <span>{{ selectedBank?.account_name || 'Thái' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b">
                <span class="font-medium">Account Number:</span>
                <span>{{ selectedBank?.account_number || '8524092000' }}</span>
              </div>
              <div class="flex justify-between py-2 border-b">
                <span class="font-medium">Amount:</span>
                <span class="font-bold">{{ formatCurrency(grandTotal) }}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="font-medium">Reference:</span>
                <span>Payment for order</span>
              </div>
            </div>
          </div>
          
          <n-button 
            type="primary" 
            class="w-full mt-4"
            @click="processQRPayment"
          >
            Complete Payment
          </n-button>
        </template>
      </n-card>
      
      <!-- Action buttons -->
      <div class="flex gap-2">
        <n-button type="default" class="flex-1" @click="clearCart">Clear All</n-button>
        <n-button 
          v-if="paymentMethod === 'cash'" 
          type="primary" 
          class="flex-1" 
          @click="processPayment" 
          :disabled="!canCheckout || paymentProcessing"
          :loading="paymentProcessing"
        >
          Complete
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
import BarcodeScanner from '@/components/BarcodeScanner.vue';

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
const cardInfo = ref({
  name: '',
  number: '',
  expMonth: '',
  expYear: '',
  cvv: ''
});
const testCardOptions = ref([
  { label: '4242424242424242', value: '4242424242424242' },
  { label: '4000111111111115', value: '4000111111111115' },
  { label: '5555555555554444', value: '5555555555554444' },
  { label: '378282246310005', value: '378282246310005' },
  { label: '371449635398431', value: '371449635398431' }
]);
const monthOptions = ref(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
const yearOptions = ref(['2024', '2025', '2026', '2027', '2028', '2029', '2030']);
const selectedBank = ref(null);

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
  if (cart.value.length === 0) return false;
  
  // For cash payments, check if amount paid is sufficient
  if (paymentMethod.value === 'cash') {
    return Number(amountPaid.value) >= grandTotal.value;
  }
  
  // For card and bank transfer, always allow checkout if cart has items
  return true;
});

// Set active category
const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
};

// Add medicine to cart
const addToCart = (medicine) => {
  console.log('Adding medicine to cart:', medicine);
  
  // Check if medicine has stock
  if (!medicine.stocks || medicine.stocks.length === 0) {
    console.warn(`${medicine.name} has no stocks:`, medicine.stocks);
    message.error(`${medicine.name} is out of stock`);
    return;
  }
  
  // Select the newest stock that is not expired
  const validStocks = medicine.stocks.filter(stock => 
    stock.unit_quantity > 0 && 
    new Date(stock.expiry_date) > new Date()
  );
  
  console.log('Valid stocks found:', validStocks.length);
  
  if (validStocks.length === 0) {
    message.error(`${medicine.name} is out of stock or expired`);
    return;
  }
  
  // Sort by expiry date ascending (FIFO)
  validStocks.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const stock = validStocks[0];
  
  // Calculate days left until expiry
  const today = new Date();
  const expiryDate = new Date(stock.expiry_date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Determine discount based on expiry status
  let discountPercentage = 0;
  let discountReason = '';
  
  if (daysLeft <= 7) {
    // Critical - 50% discount
    discountPercentage = 50;
    discountReason = 'Critical expiry (≤ 7 days)';
  } else if (daysLeft <= 30) {
    // Warning - 20% discount
    discountPercentage = 20;
    discountReason = 'Warning expiry (≤ 30 days)';
  }
  
  // Calculate discounted price
  const originalPrice = stock.mrp || medicine.price || 0;
  const discountedPrice = discountPercentage > 0 
    ? Math.round(originalPrice * (1 - discountPercentage / 100)) 
    : originalPrice;
  
  const existingItem = cart.value.find(item => 
    item._id === medicine._id && item.batch_id === stock.batch_id
  );
  
  if (existingItem) {
    if (existingItem.quantity < stock.unit_quantity) {
      existingItem.quantity += 1;
      message.success(`Added ${medicine.name} to cart`);
      
      // Show discount message if applicable
      if (discountPercentage > 0) {
        message.info(`${discountReason}: ${discountPercentage}% discount applied`);
      }
    } else {
      message.warning(`Cannot add more. Only ${stock.unit_quantity} ${medicine.name} left in batch ${stock.batch_id}`);
    }
  } else {
    cart.value.push({
      _id: medicine._id,
      name: medicine.name,
      original_price: originalPrice,
      price: discountedPrice,
      discount_percentage: discountPercentage,
      discount_reason: discountReason,
      vat: stock.vat || 10,
      quantity: 1,
      batch_id: stock.batch_id,
      expiry_date: stock.expiry_date,
      max_quantity: stock.unit_quantity,
      stock_id: stock._id,
      purchase: stock.purchase,
      days_left: daysLeft
    });
    
    message.success(`Added ${medicine.name} to cart`);
    
    // Show discount message if applicable
    if (discountPercentage > 0) {
      message.info(`${discountReason}: ${discountPercentage}% discount applied`);
    }
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
  cardInfo.value = {
    name: '',
    number: '',
    expMonth: '',
    expYear: '',
    cvv: ''
  };
};

// Process payment
const paymentProcessing = ref(false);

const processPayment = async () => {
  if (cart.value.length === 0) {
    message.error('Cart is empty');
    return;
  }
  
  // Validate payment based on method
  if (paymentMethod.value === 'cash' && Number(amountPaid.value) < grandTotal.value) {
    message.error('Amount paid is less than the total');
    return;
  }
  
  if (paymentProcessing.value) {
    return; // Prevent multiple submissions
  }
  
  paymentProcessing.value = true;
  
  try {
    const invoiceData = {
      date: Date.now(),
      customer: selectedCustomer.value,
      items: cart.value.map(item => ({
        medicine: item._id,
        quantity: item.quantity,
        price: item.price,
        original_price: item.original_price || item.price,
        discount_percentage: item.discount_percentage || 0,
        discount_reason: item.discount_reason || '',
        vat: item.vat,
        subtotal: item.price * item.quantity,
        batch_id: item.batch_id,
        expiry_date: item.expiry_date,
        purchase: item.purchase,
        stock_id: item.stock_id,
        days_left: item.days_left
      })),
      subtotal: subtotal.value,
      vat_total: vatTotal.value,
      discount: discount.value,
      grand_total: grandTotal.value,
      paid: paymentMethod.value === 'cash' ? Number(amountPaid.value) : grandTotal.value, // For card and bank transfer, paid = grand_total
      due: 0,
      payment_method: paymentMethod.value,
      payment_details: paymentMethod.value === 'card' ? {
        card_type: getCardType(cardInfo.value.number),
        card_number: maskCardNumber(cardInfo.value.number),
        card_holder: cardInfo.value.name
      } : null
    };
    
    // Submit invoice to POS API endpoint
    const response = await api.post('/api/invoice/pos', invoiceData);
    
    if (response && response.status) {
      message.success('Transaction completed successfully');
      clearCart();
    } else {
      message.error(response.error || 'Failed to create invoice');
    }
  } catch (error) {
    message.error(error.message || 'An unexpected error occurred');
    console.error('POS Invoice error:', error);
  } finally {
    paymentProcessing.value = false;
  }
};

// Fetch medicines
const fetchMedicines = async () => {
  loading.value = true;
  try {
    // Get medicines and populate stock information
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
    message.error('Could not load medicine data');
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

// Function to get available stock for a medicine
const getMedicineAvailableStock = (medicine) => {
  if (!medicine.stocks || medicine.stocks.length === 0) {
    return 0;
  }
  
  // Filter valid stocks (not expired and quantity > 0)
  const validStocks = medicine.stocks.filter(stock => 
    stock.unit_quantity > 0 && 
    new Date(stock.expiry_date) > new Date()
  );
  
  // Sum up available quantities
  return validStocks.reduce((total, stock) => total + stock.unit_quantity, 0);
};

// Update cart total
const updateCartTotal = () => {
  // Make sure each item's total is correctly calculated with the discounted price
  cart.value.forEach(item => {
    if (item.original_price && item.discount_percentage) {
      // Recalculate discounted price to ensure accuracy
      item.price = item.original_price * (1 - item.discount_percentage / 100);
    }
  });
  
  // Computed properties will handle recalculation automatically
};

// Process card payment
const processCardPayment = () => {
  // Validate card information
  if (!cardInfo.value.name.trim()) {
    message.error('Please enter the cardholder name');
    return;
  }
  
  if (!cardInfo.value.number) {
    message.error('Please select a card number');
    return;
  }
  
  if (!cardInfo.value.expMonth || !cardInfo.value.expYear) {
    message.error('Please select an expiry date');
    return;
  }
  
  if (!cardInfo.value.cvv || cardInfo.value.cvv.length < 3) {
    message.error('Please enter a valid CVV');
    return;
  }
  
  // Process payment
  message.success('Card payment successful');
  processPayment();
};

// Process QR payment
const processQRPayment = () => {
  // In a real implementation, this would show a QR code and wait for callback confirmation
  message.success('Bank transfer payment successful');
  processPayment();
};

// Utility functions for card processing
const getCardType = (number) => {
  if (!number) return '';
  
  // Visa
  if (/^4/.test(number)) return 'Visa';
  
  // Mastercard
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  
  // Amex
  if (/^3[47]/.test(number)) return 'American Express';
  
  // Discover
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  
  return 'Unknown';
};

const maskCardNumber = (number) => {
  if (!number) return '';
  
  const lastFour = number.slice(-4);
  const masked = '*'.repeat(number.length - 4);
  
  return masked + lastFour;
};

// Fetch bank accounts
const fetchBankAccounts = async () => {
  try {
    const response = await api.get('/api/bank', { 
      params: { limit: 1, status: true } 
    });
    
    if (response && response.data && response.data.length > 0) {
      selectedBank.value = response.data[0];
    }
  } catch (error) {
    console.error('Failed to fetch bank account:', error);
  }
};

// Process barcode scan
const onBarcodeScanned = async (barcode) => {
  if (!barcode) return;
  
  // Show loading message
  message.loading('Scanning product barcode...');
  console.log(`Scanning barcode: ${barcode}`);
  
  try {
    // Search for medicine by barcode
    const response = await api.get('/api/medicine', { 
      params: { 
        bar_code: barcode,
        populate: 'stocks',
        limit: 1
      } 
    });
    
    console.log('Barcode search response:', response);
    
    if (response && response.data && response.data.length > 0) {
      const medicine = response.data[0];
      console.log('Found medicine:', medicine.name, 'with ID:', medicine._id);
      
      // Add the medicine to cart
      addToCart(medicine);
      message.success(`Found and added ${medicine.name} to cart`);
    } else {
      message.error(`Barcode ${barcode} not found in system`);
    }
  } catch (error) {
    console.error('Barcode scan error:', error);
    message.error('Failed to process barcode');
  }
};

onMounted(async () => {
  await Promise.all([fetchMedicines(), fetchCustomers(), fetchBankAccounts()]);
});
</script> 