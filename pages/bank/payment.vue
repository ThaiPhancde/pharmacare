<template>
  <div>
    <PageHeader title="Payment Information" subtitle="Scan QR code to make payment" />

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
      <n-card v-for="bank in activeBank" :key="bank.id" class="shadow-md hover:shadow-lg transition-shadow">
        <template #header>
          <div class="text-xl font-bold text-primary">{{ bank.bank_name }}</div>
        </template>
        
        <div class="flex flex-col items-center space-y-4">
          <!-- QR Code Display (enlarged) -->
          <div class="border border-gray-200 p-4 rounded-lg" v-if="bank.qr_image">
            <img :src="bank.qr_image" alt="QR Code" class="w-64 h-64 object-contain" />
          </div>
          <div v-else class="text-center p-8 bg-gray-100 rounded-lg w-64 h-64 flex items-center justify-center">
            <span class="text-gray-500">No QR code available</span>
          </div>
          
          <!-- Bank Account Information -->
          <div class="w-full space-y-2">
            <div class="flex justify-between items-center py-2 border-b">
              <span class="text-gray-600 font-medium">Account Name:</span>
              <span class="font-semibold">{{ bank.account_name }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b">
              <span class="text-gray-600 font-medium">Account Number:</span>
              <span class="font-semibold">{{ bank.account_number }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b">
              <span class="text-gray-600 font-medium">Branch:</span>
              <span class="font-semibold">{{ bank.branch || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Empty state when no banks are available -->
      <n-empty v-if="activeBank.length === 0" description="No payment methods available">
        <template #extra>
          <n-button @click="navigateToSettings">Add Bank Account</n-button>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/base/PageHeader.vue';
import { useToast } from '@/components/ui/toast';

const router = useRouter();
const toast = useToast();
const bankAccounts = ref([]);
const loading = ref(false);

const activeBank = computed(() => {
  return bankAccounts.value.filter(bank => bank.status === true);
});

const fetchBankAccounts = async () => {
  loading.value = true;
  try {
    // For testing, use mock data instead of API call
    bankAccounts.value = [
      {
        id: '1',
        bank_name: 'Sample Bank',
        account_name: 'John Doe',
        account_number: '1234567890',
        branch: 'Main Branch',
        qr_image: null,
        status: true
      }
    ];
    
    // Uncomment when API is working
    // const response = await fetch('/api/bank');
    // const result = await response.json();
    // if (result.status) {
    //   bankAccounts.value = result.data || [];
    // } else {
    //   toast.error(result.message || 'Failed to fetch bank accounts');
    // }
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    toast.error('Failed to load bank information');
  } finally {
    loading.value = false;
  }
};

const navigateToSettings = () => {
  router.push('/bank');
};

onMounted(() => {
  fetchBankAccounts();
});
</script> 