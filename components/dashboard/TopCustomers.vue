<script setup lang="ts">
import { NSpin, NBadge } from 'naive-ui';
import { useToast } from "@/components/ui/toast/use-toast";
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-vue-next';

interface TopCustomer {
  _id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  totalPurchases: number;
  orderCount: number;
  lastPurchase: string;
}

const topCustomers = ref<TopCustomer[]>([]);
const loading = ref(false);
const { toast } = useToast();

// Fetch top customers data
const fetchTopCustomers = async () => {
  loading.value = true;
  try {
    const response = await useFetch<{
      status: boolean;
      data?: TopCustomer[];
      error?: string;
      message?: string;
    }>('/api/dashboard/top-customers', {
      key: 'top-customers',
      query: {
        limit: 5
      }
    });
    
    const responseData = response.data.value;
    if (responseData?.status && responseData.data) {
      topCustomers.value = responseData.data;
    }
  } catch (error) {
    console.error('Error fetching top customers:', error);
    toast({
      title: 'Error',
      description: 'Unable to load top customers data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Fetch data when component is mounted
onMounted(() => {
  fetchTopCustomers();
});

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Get rank badge color
const getRankColor = (index: number) => {
  switch (index) {
    case 0: return 'gold';
    case 1: return 'silver';
    case 2: return '#CD7F32'; // Bronze
    default: return 'gray';
  }
};
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <n-spin size="medium" />
    </div>
    
    <div v-else-if="topCustomers.length === 0" class="text-center py-8 text-gray-500">
      No customer data available
    </div>
    
    <div v-else>
      <div class="space-y-3">
        <div 
          v-for="(customer, index) in topCustomers" 
          :key="customer._id" 
          class="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- Rank Badge -->
            <div 
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              :style="{ backgroundColor: getRankColor(index) }"
            >
              {{ index + 1 }}
            </div>
            
            <!-- Customer Info -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium truncate">{{ customer.customerName || 'Unknown Customer' }}</h4>
              <p class="text-xs text-muted-foreground truncate">
                {{ customer.customerEmail || customer.customerPhone || 'No contact info' }}
              </p>
            </div>
            
            <!-- Stats -->
            <div class="text-right">
              <p class="font-semibold text-sm text-primary">{{ formatCurrency(customer.totalPurchases) }}</p>
              <p class="text-xs text-muted-foreground">{{ customer.orderCount }} orders</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <NuxtLink to="/customers" class="text-sm text-blue-500 hover:underline">
          View all customers
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
