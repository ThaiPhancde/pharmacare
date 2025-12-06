<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";

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

// Default data
const dataPlaceholder: ChartDataItem[] = [
  { name: 'Jan', total: 0 },
  { name: 'Feb', total: 0 },
  { name: 'Mar', total: 0 },
  { name: 'Apr', total: 0 },
  { name: 'May', total: 0 },
  { name: 'Jun', total: 0 },
  { name: 'Jul', total: 0 },
  { name: 'Aug', total: 0 },
  { name: 'Sep', total: 0 },
  { name: 'Oct', total: 0 },
  { name: 'Nov', total: 0 },
  { name: 'Dec', total: 0 },
];

// Chart data
const chartData = ref<ChartDataItem[]>(dataPlaceholder);

// Current year selection
const currentYear = 2025;
const selectedYear = ref(currentYear);

// Year options (5 years before and after current year)
const yearOptions = computed(() => {
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
});

// Loading state
const loading = ref(false);
const { toast } = useToast();

// Fetch chart data
const fetchChartData = async () => {
  loading.value = true;
  try {
    const response = await useFetch<ChartApiResponse>('/api/dashboard/chart', {
      key: `chart-${selectedYear.value}`,
      query: {
        year: selectedYear.value,
      },
    });
    
    const responseData = response.data.value;
    if (responseData?.status && responseData.data) {
      chartData.value = responseData.data;
    }
  } catch (error) {
    console.error('Error fetching chart data:', error);
    toast({
      title: 'Error',
      description: 'Unable to load chart data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Handle year changes
watch(selectedYear, () => {
  fetchChartData();
});

// Fetch data when component is mounted
onMounted(() => {
  fetchChartData();
});
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <Select v-model="selectedYear" :options="yearOptions" />
    </div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner size="lg" />
    </div>
    <div v-else>
      <BarChart :data="chartData" :categories="['total']" index="name" :rounded-corners="4" />
    </div>
  </div>
</template>
