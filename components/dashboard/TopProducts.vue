<script setup lang="ts">
import { NSpin, NBadge } from 'naive-ui';
import { useToast } from "@/components/ui/toast/use-toast";
import { Package, TrendingUp, DollarSign } from 'lucide-vue-next';

interface TopProduct {
  _id: string;
  medicineName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
  category?: string;
}

const topProducts = ref<TopProduct[]>([]);
const loading = ref(false);
const { toast } = useToast();

// Fetch top products data
const fetchTopProducts = async () => {
  loading.value = true;
  try {
    const response = await useFetch<{
      status: boolean;
      data?: TopProduct[];
      error?: string;
      message?: string;
    }>('/api/dashboard/top-products', {
      key: 'top-products',
      query: {
        limit: 5
      }
    });
    
    const responseData = response.data.value;
    if (responseData?.status && responseData.data) {
      topProducts.value = responseData.data;
    }
  } catch (error) {
    console.error('Error fetching top products:', error);
    toast({
      title: 'Error',
      description: 'Unable to load top products data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Fetch data when component is mounted
onMounted(() => {
  fetchTopProducts();
});

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

// Format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
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
    
    <div v-else-if="topProducts.length === 0" class="text-center py-8 text-gray-500">
      No product sales data available
    </div>
    
    <div v-else>
      <div class="space-y-3">
        <div 
          v-for="(product, index) in topProducts" 
          :key="product._id" 
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
            
            <!-- Product Info -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium truncate">{{ product.medicineName || 'Unknown Product' }}</h4>
              <p class="text-xs text-muted-foreground">
                {{ formatNumber(product.totalQuantitySold) }} units sold
              </p>
            </div>
            
            <!-- Stats -->
            <div class="text-right">
              <p class="font-semibold text-sm text-green-600">{{ formatCurrency(product.totalRevenue) }}</p>
              <p class="text-xs text-muted-foreground">{{ product.orderCount }} orders</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <NuxtLink to="/medicine" class="text-sm text-blue-500 hover:underline">
          View all products
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
