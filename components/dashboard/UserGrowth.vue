<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { Users, TrendingUp, TrendingDown, Calendar } from "lucide-vue-next";
import NumberFlow from "@number-flow/vue";
import { AreaChart } from "@/components/ui/chart-area";

interface GrowthDataItem {
  name: string;
  total: number;
  growth?: number;
}

interface GrowthApiResponse {
  status: boolean;
  data?: GrowthDataItem[];
  summary?: {
    totalUsers: number;
    currentPeriodGrowth: number;
    previousPeriodGrowth: number;
    growthRate: number;
  };
  error?: string;
  message?: string;
}

// Chart data
const chartData = ref<GrowthDataItem[]>([]);
const summary = ref({
  totalUsers: 0,
  currentPeriodGrowth: 0,
  previousPeriodGrowth: 0,
  growthRate: 0,
});

// Current year selection - use actual current year
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);

// Period type: month, quarter
type PeriodType = 'month' | 'quarter';
const selectedPeriod = ref<PeriodType>('quarter');

// Year options (5 years before current year)
const yearOptions = computed(() => {
  const years = [];
  for (let i = currentYear - 5; i <= currentYear; i++) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
});

// Period type options
const periodOptions = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
];

// Loading state
const loading = ref(false);
const { toast } = useToast();

// Fetch growth data
const fetchGrowthData = async () => {
  loading.value = true;
  try {
    // Force refresh by using timestamp
    const timestamp = Date.now();
    const response = await $fetch<GrowthApiResponse>('/api/dashboard/user-growth', {
      query: {
        year: selectedYear.value,
        period: selectedPeriod.value,
        _t: timestamp, // Cache buster
      },
    });
    
    if (response?.status && response.data) {
      chartData.value = response.data;
      if (response.summary) {
        summary.value = response.summary;
      }
    }
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    toast({
      title: 'Error',
      description: 'Unable to load user growth data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Handle changes
watch([selectedYear, selectedPeriod], () => {
  fetchGrowthData();
});

// Fetch data when component is mounted
onMounted(() => {
  fetchGrowthData();
});

// Get growth indicator color
const getGrowthColor = (growth: number) => {
  if (growth > 0) return 'text-green-500';
  if (growth < 0) return 'text-red-500';
  return 'text-gray-500';
};

// Format percentage
const formatPercentage = (value: number) => {
  return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
};
</script>

<template>
  <Card class="w-full overflow-hidden">
    <CardHeader class="pb-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Users class="h-5 w-5 text-primary" />
          <CardTitle class="text-lg">Customer Growth</CardTitle>
        </div>
        <div class="flex items-center gap-2">
          <!-- Period Selector -->
          <Select v-model="selectedPeriod">
            <SelectTrigger class="w-[130px] h-8">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in periodOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Year Selector -->
          <Select v-model="selectedYear">
            <SelectTrigger class="w-[90px] h-8">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in yearOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent class="pb-4">
      <!-- Summary Stats -->
      <div class="grid grid-cols-4 gap-4 mb-2">
        <div class="text-center p-2 bg-muted/50 rounded-lg">
          <p class="text-xs text-muted-foreground">Total Customers</p>
          <p class="text-xl font-bold text-primary">
            <NumberFlow :value="summary.totalUsers" />
          </p>
        </div>
        <div class="text-center p-2 bg-muted/50 rounded-lg">
          <p class="text-xs text-muted-foreground">This Period</p>
          <p class="text-xl font-bold text-green-600">
            +<NumberFlow :value="summary.currentPeriodGrowth" />
          </p>
        </div>
        <div class="text-center p-2 bg-muted/50 rounded-lg">
          <p class="text-xs text-muted-foreground">Last Period</p>
          <p class="text-xl font-bold text-blue-600">
            +<NumberFlow :value="summary.previousPeriodGrowth" />
          </p>
        </div>
        <div class="text-center p-2 bg-muted/50 rounded-lg">
          <p class="text-xs text-muted-foreground">Growth</p>
          <div class="flex items-center justify-center gap-1">
            <TrendingUp v-if="summary.growthRate >= 0" class="h-4 w-4 text-green-500" />
            <TrendingDown v-else class="h-4 w-4 text-red-500" />
            <p class="text-xl font-bold" :class="getGrowthColor(summary.growthRate)">
              {{ formatPercentage(summary.growthRate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-[180px]">
        <Spinner size="lg" />
      </div>

      <!-- Chart -->
      <div v-else-if="chartData.length > 0">
        <AreaChart 
          :data="chartData" 
          :categories="['total']" 
          index="name"
          :show-legend="false"
          :show-x-axis="true"
          :show-y-axis="false"
          :show-grid-line="false"
          class="h-[180px]"
        />
      </div>
      
      <!-- No Data -->
      <div v-else class="h-[180px] flex items-center justify-center text-muted-foreground">
        Không có dữ liệu
      </div>
    </CardContent>
  </Card>
</template>
