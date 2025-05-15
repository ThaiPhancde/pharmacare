<template>
  <div class="relative inline-block" ref="containerRef">
    <!-- Icon with badge -->
    <n-button 
      class="rounded-full hover:bg-gray-600" 
      quaternary 
      @click="isOpen = !isOpen"
    >
      <Badge v-if="expiringCount > 0" class="absolute -top-1 -right-1" variant="destructive">
        {{ expiringCount > 99 ? '99+' : expiringCount }}
      </Badge>
      <Icon name="i-lucide-pill" class="h-6 w-6 text-red-600" />
    </n-button>
    
    <!-- Dropdown content -->
    <div 
      v-if="isOpen" 
      class="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-gray-600 ring-1 ring-primary ring-opacity-5 z-50"
    >
      <div class="p-3 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-red-700 flex items-center gap-2">
            <Icon name="i-lucide-alert-circle" class="h-4 w-4 text-red-600" />
            Expiring Medicines
          </h3>
          <span class="text-xs text-gray-500">{{ expiringCount }} items</span>
        </div>
      </div>
      
      <div class="max-h-60 overflow-y-auto">
        <!-- Stats -->
        <div class="p-2 bg-gray-50">
          <div class="flex gap-2 justify-between">
            <div class="flex flex-col items-center p-1">
              <span class="text-xs text-gray-500">Expired</span>
              <span class="text-sm font-bold text-red-600">{{ stats.expired }}</span>
            </div>
            <div class="flex flex-col items-center p-1">
              <span class="text-xs text-gray-500">Critical</span>
              <span class="text-sm font-bold text-orange-600">{{ stats.critical }}</span>
            </div>
            <div class="flex flex-col items-center p-1">
              <span class="text-xs text-gray-500">Warning</span>
              <span class="text-sm font-bold text-yellow-600">{{ stats.warning }}</span>
            </div>
            <div class="flex flex-col items-center p-1">
              <span class="text-xs text-gray-500">Good</span>
              <span class="text-sm font-bold text-green-600">{{ stats.good }}</span>
            </div>
          </div>
        </div>
        
        <!-- Bar chart visualization -->
        <div class="flex items-end h-10 p-2 gap-1 border-b border-gray-100 justify-center">
          <div 
            v-if="stats.expired > 0"
            class="bg-red-500 w-6 rounded-t transition-all duration-300"
            :style="`height: ${Math.min(100, Math.max(20, stats.expired * 8))}%;`"
            :title="`${stats.expired} expired`">
          </div>
          <div 
            v-if="stats.critical > 0"
            class="bg-orange-500 w-6 rounded-t transition-all duration-300"
            :style="`height: ${Math.min(100, Math.max(20, stats.critical * 8))}%;`"
            :title="`${stats.critical} critical`">
          </div>
          <div 
            v-if="stats.warning > 0"
            class="bg-yellow-500 w-6 rounded-t transition-all duration-300"
            :style="`height: ${Math.min(100, Math.max(20, stats.warning * 8))}%;`"
            :title="`${stats.warning} warning`">
          </div>
          <div 
            v-if="stats.good > 0"
            class="bg-green-500 w-6 rounded-t transition-all duration-300"
            :style="`height: ${Math.min(100, Math.max(20, stats.good * 8))}%;`"
            :title="`${stats.good} good`">
          </div>
        </div>
      </div>
      
      <div class="p-2 bg-gray-50 border-t border-gray-100">
        <n-button 
          type="error" 
          class="w-full text-xs bg-red-600 text-white" 
          size="small" 
          @click="viewDetails"
        >
          View All Expiring Medicines
          <template #icon>
            <Icon name="i-lucide-arrow-right" class="h-3 w-3" />
          </template>
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Badge } from "@/components/ui/badge";
import { onClickOutside } from '@vueuse/core';

const router = useRouter();
const containerRef = ref(null);
const isOpen = ref(false);
const expiringCount = ref(0);
const daysRange = ref(30);
const stats = reactive({
  expired: 0,
  critical: 0,
  warning: 0,
  good: 0
});

// Close popup when clicking outside
onClickOutside(containerRef, () => {
  isOpen.value = false;
});

// Navigate to details page
const viewDetails = () => {
  router.push('/stock/expiring');
  isOpen.value = false;
};

// Fetch expiring medicines count and statistics
const fetchExpiringMedicines = async () => {
  try {
    // First get total count
    const countRes = await api.get("/api/stock/expiring", {
      params: { page: 1, limit: 1, days: daysRange.value },
    });
    expiringCount.value = countRes.total || 0;
    
    // Then get detailed data for statistics
    if (expiringCount.value > 0) {
      const detailRes = await api.get("/api/stock/expiring", {
        params: { page: 1, limit: 100, days: daysRange.value },
      });
      
      // Reset stats
      stats.expired = 0;
      stats.critical = 0;
      stats.warning = 0;
      stats.good = 0;
      
      // Calculate statistics
      detailRes.data.forEach(item => {
        if (item.daysLeft <= 0) stats.expired++;
        else if (item.daysLeft <= 7) stats.critical++;
        else if (item.daysLeft <= 30) stats.warning++;
        else stats.good++;
      });
    }
  } catch (error) {
    console.error("Unable to load expiring medicines data:", error);
  }
};

// Fetch data initially and set up auto-refresh
onMounted(() => {
  fetchExpiringMedicines();
  // Optional: Refresh data every 5 minutes
  const interval = setInterval(fetchExpiringMedicines, 5 * 60 * 1000);
  
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script>
