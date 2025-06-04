<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <div class="text-center">
        <!-- Success State -->
        <div v-if="paymentStatus === 'success'">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <Icon name="i-lucide-check-circle" class="h-10 w-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p class="text-gray-600 mb-4">Your MoMo payment has been processed successfully.</p>
          <div class="bg-gray-50 rounded p-4 mb-6">
            <div class="text-sm text-gray-600">
              <p><strong>Order ID:</strong> {{ orderId }}</p>
              <p><strong>Amount:</strong> {{ formatCurrency(amount) }}</p>
              <p><strong>Transaction ID:</strong> {{ transId }}</p>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="paymentStatus === 'error'">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Icon name="i-lucide-x-circle" class="h-10 w-10 text-red-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p class="text-gray-600 mb-4">{{ errorMessage || 'Your payment could not be processed.' }}</p>
        </div>

        <!-- Processing State -->
        <div v-else>
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <n-spin size="large" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
          <p class="text-gray-600 mb-4">Please wait while we verify your payment.</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 justify-center">
          <n-button type="primary" @click="goToInvoice" v-if="paymentStatus === 'success'">
            View Invoice
          </n-button>
          <n-button @click="goToPos">
            {{ paymentStatus === 'success' ? 'New Transaction' : 'Back to POS' }}
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const paymentStatus = ref('processing');
const orderId = ref('');
const amount = ref(0);
const transId = ref('');
const errorMessage = ref('');

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0 
  }).format(value);
};

const goToInvoice = () => {
  router.push(`/invoice/${orderId.value}`);
};

const goToPos = () => {
  router.push('/invoice/pos');
};

onMounted(() => {
  // Get query parameters from MoMo callback
  const query = route.query;
  
  if (query.resultCode === '0') {
    paymentStatus.value = 'success';
    orderId.value = query.orderId || '';
    amount.value = parseInt(query.amount) || 0;
    transId.value = query.transId || '';
  } else {
    paymentStatus.value = 'error';
    errorMessage.value = query.message || 'Payment failed';
  }
});
</script> 