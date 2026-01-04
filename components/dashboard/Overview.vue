<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { Calendar, Filter } from "lucide-vue-next";
import { AreaChart } from "@/components/ui/chart-area";

interface ChartDataItem {
  name: string;
  total: number;
}

interface ChartApiResponse {
  status: boolean;
  data?: ChartDataItem[];
  error?: string;
  message?: string;
}

// Default placeholder data for different periods
const getDefaultData = (period: string, month?: number, quarter?: number): ChartDataItem[] => {
  if (period === 'day') {
    const year = new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    const daysInMonth = new Date(year, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({ name: (i + 1).toString(), total: 0 }));
  } else if (period === 'quarter') {
    const q = quarter || 1;
    const startMonth = (q - 1) * 3 + 1;
    const monthNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return Array.from({ length: 3 }, (_, i) => ({ name: monthNames[startMonth + i], total: 0 }));
  } else if (period === 'year') {
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(name => ({ name, total: 0 }));
  } else {
    // month - default
    return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map(name => ({ name, total: 0 }));
  }
};

// Chart data - initialize with default month data
const chartData = ref<ChartDataItem[]>(getDefaultData('month'));

// Current year selection - use actual current year
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);

// Period type: day, month, quarter, year
type PeriodType = 'day' | 'month' | 'quarter' | 'year';
const selectedPeriod = ref<PeriodType>('month');

// Selected month for daily view
const selectedMonth = ref(new Date().getMonth() + 1);

// Selected quarter for quarter view
const selectedQuarter = ref(Math.ceil((new Date().getMonth() + 1) / 3));

// Year options (5 years before and after current year)
const yearOptions = computed(() => {
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
});

// Month options
const monthOptions = computed(() => [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]);

// Quarter options
const quarterOptions = computed(() => [
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' },
]);

// Period type options
const periodOptions = [
  { value: 'day', label: 'Daily' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
];

// Loading state
const loading = ref(false);
const { toast } = useToast();

// Fetch chart data
const fetchChartData = async () => {
  loading.value = true;
  try {
    // Force refresh by using timestamp
    const timestamp = Date.now();
    const response = await $fetch<ChartApiResponse>('/api/dashboard/chart', {
      query: {
        year: selectedYear.value,
        period: selectedPeriod.value,
        month: selectedMonth.value,
        quarter: selectedQuarter.value,
        _t: timestamp, // Cache buster
      },
    });
    
    if (response?.status && response.data && response.data.length > 0) {
      chartData.value = response.data;
    } else {
      // Use default placeholder data if no data returned
      chartData.value = getDefaultData(selectedPeriod.value, selectedMonth.value, selectedQuarter.value);
    }
  } catch (error) {
    console.error('Error fetching chart data:', error);
    // Use default placeholder data on error
    chartData.value = getDefaultData(selectedPeriod.value, selectedMonth.value, selectedQuarter.value);
    toast({
      title: 'Error',
      description: 'Unable to load chart data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Handle changes
watch([selectedYear, selectedPeriod, selectedMonth, selectedQuarter], () => {
  fetchChartData();
});

// Fetch data when component is mounted
onMounted(() => {
  fetchChartData();
});
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-end gap-2 mb-4">
      <!-- Period Type Selector -->
      <Select v-model="selectedPeriod">
        <SelectTrigger class="w-[130px]">
          <Filter class="w-4 h-4 mr-2" />
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in periodOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Month Selector (only show when period is 'day') -->
      <Select v-if="selectedPeriod === 'day'" v-model="selectedMonth">
        <SelectTrigger class="w-[140px]">
          <Calendar class="w-4 h-4 mr-2" />
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in monthOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Quarter Selector (only show when period is 'quarter') -->
      <Select v-if="selectedPeriod === 'quarter'" v-model="selectedQuarter">
        <SelectTrigger class="w-[100px]">
          <Calendar class="w-4 h-4 mr-2" />
          <SelectValue placeholder="Quarter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in quarterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Year Selector -->
      <Select v-model="selectedYear">
        <SelectTrigger class="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in yearOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div v-if="loading" class="flex justify-center items-center h-[350px]">
      <Spinner size="lg" />
    </div>
    <div v-else>
      <AreaChart 
        :data="chartData" 
        :categories="['total']" 
        index="name" 
        :show-legend="false"
        :show-x-axis="true"
        :show-y-axis="true"
        :show-grid-line="true"
        class="h-[350px]"
      />
    </div>
  </div>
</template>
