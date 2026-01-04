<script setup lang="ts">
import NumberFlow from "@number-flow/vue";
import {
  Users,
  BriefcaseMedical,
  Archive,
  TestTubeDiagonal,
  Download,
  Loader2,
} from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import TopCustomers from "@/components/dashboard/TopCustomers.vue";
import TopProducts from "@/components/dashboard/TopProducts.vue";
import UserGrowth from "@/components/dashboard/UserGrowth.vue";
import { downloadExcelReport, type WorkbookData } from "@/utils/excel-export";

interface CardData {
  totalCustomer: number;
  totalCustomerDesc: number;
  totalMedicine: number;
  totalMedicineDesc: number;
  sales: number;
  salesDesc: number;
  expiredMedicine: number;
  expiredMedicineDesc: number;
}

interface DashboardResponse {
  status: boolean;
  data?: {
    cardData: CardData;
  };
  error?: string;
  message?: string;
}

interface ExportResponse {
  status: boolean;
  data?: WorkbookData;
  error?: string;
  message?: string;
}

const dataCard = ref<CardData>({
  totalCustomer: 0,
  totalCustomerDesc: 0,
  totalMedicine: 0,
  totalMedicineDesc: 0,
  sales: 0,
  salesDesc: 0,
  expiredMedicine: 0,
  expiredMedicineDesc: 0,
});

// Default date range (current month)
const date = ref({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  to: new Date(),
});

// Used to trigger data reload on date change
const reloadTrigger = ref(0);

// Export loading state
const isExporting = ref(false);

// API to fetch dashboard data
const fetchDashboardData = async () => {
  try {
    const response = await useFetch<DashboardResponse>('/api/dashboard', {
      key: `dashboard-${reloadTrigger.value}`,
      query: {
        from: date.value.from?.toISOString(),
        to: date.value.to?.toISOString(),
      }
    });
    
    const responseData = response.data.value;
    if (responseData?.status && responseData.data) {
      dataCard.value = responseData.data.cardData;
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    toast({
      title: 'Error',
      description: 'Unable to load dashboard data',
      variant: 'destructive',
    });
  }
};

// Handle date range changes
const handleDateRangeChange = (newDateRange: {from: Date, to: Date}) => {
  date.value = newDateRange;
  reloadTrigger.value++;
};

// Handle Excel export
const handleExportExcel = async () => {
  isExporting.value = true;
  try {
    const response = await $fetch<ExportResponse>('/api/dashboard/export-excel', {
      query: {
        from: date.value.from?.toISOString(),
        to: date.value.to?.toISOString(),
      }
    });
    
    if (response?.status && response.data) {
      downloadExcelReport(response.data);
      toast({
        title: 'Export Successful',
        description: 'Dashboard report has been downloaded successfully.',
      });
    } else {
      throw new Error(response?.error || 'Export failed');
    }
  } catch (error: any) {
    console.error('Error exporting report:', error);
    toast({
      title: 'Export Failed',
      description: error.message || 'Unable to export dashboard report. Please try again.',
      variant: 'destructive',
    });
  } finally {
    isExporting.value = false;
  }
};

const { toast } = useToast();

onMounted(() => {
  fetchDashboardData();
});

// Watch for date changes
watch([() => date.value.from, () => date.value.to], () => {
  reloadTrigger.value++;
}, { deep: true });
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
      <div class="flex items-center space-x-2">
        <BaseDateRangePicker v-model="date" @update:model-value="handleDateRangeChange" />
        <Button
          @click="handleExportExcel"
          :disabled="isExporting"
          class="gap-2"
        >
          <Loader2 v-if="isExporting" class="h-4 w-4 animate-spin" />
          <Download v-else class="h-4 w-4" />
          {{ isExporting ? 'Exporting...' : 'Download Report' }}
        </Button>
      </div>
    </div>
    <main class="flex flex-1 flex-col gap-4 md:gap-8">
      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 md:gap-8">
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-primary text-sm font-medium">
              Total Customer
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.totalCustomer" />
            </div>
            <p class="text-xs text-muted-foreground">
              <span v-if="dataCard.totalCustomerDesc !== 0" :class="dataCard.totalCustomerDesc >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ dataCard.totalCustomerDesc >= 0 ? '+' : '' }}{{ dataCard.totalCustomerDesc.toFixed(1) }}%
              </span>
              <span v-else class="text-gray-500">0%</span>
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-green-500 text-sm font-medium">
              Total Medicine
            </CardTitle>
            <BriefcaseMedical class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.totalMedicine" />
            </div>
            <p class="text-xs text-muted-foreground">
              Total medicines in system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-red-500 text-sm font-medium">
              Expired Medicine
            </CardTitle>
            <Archive class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.sales" />
            </div>
            <p class="text-xs text-muted-foreground">
              <span v-if="dataCard.sales > 0" class="text-red-600">
                Requires immediate action
              </span>
              <span v-else class="text-green-600">
                No expired medicines
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-orange-500 text-sm font-medium">
              Expiring Medicine
            </CardTitle>
            <TestTubeDiagonal class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.expiredMedicine" />
            </div>
            <p class="text-xs text-muted-foreground">
              <span v-if="dataCard.expiredMedicine > 0" class="text-orange-600">
                Within 30 days
              </span>
              <span v-else class="text-green-600">
                No expiring medicines
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
      <!-- User Growth Chart - Full Width -->
      <div class="grid gap-4 lg:grid-cols-1 md:gap-8">
        <UserGrowth />
      </div>
      <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-8">
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <DashboardOverview />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomers />
          </CardContent>
        </Card>
      </div>
      <div class="grid gap-4 lg:grid-cols-1 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProducts />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
