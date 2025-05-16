<script setup lang="ts">
import NumberFlow from "@number-flow/vue";
import {
  Users,
  BriefcaseMedical,
  Archive,
  TestTubeDiagonal,
} from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import ExpiringMedicines from "@/components/dashboard/ExpiringMedicines.vue";

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
          @click="
            () =>
              toast({
                title: 'Scheduled: Catch up',
                description: 'Friday, February 10, 2023 at 5:57 PM',
              })
          "
          >Download</Button
        >
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
              <NumberFlow
                :value="dataCard.totalCustomerDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
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
              <NumberFlow :value="dataCard.totalMedicine" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.totalMedicineDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-red-500 text-sm font-medium">
              Out of Stock
            </CardTitle>
            <Archive class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.sales" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.salesDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-orange-500 text-sm font-medium">
              Expired Medicine
            </CardTitle>
            <TestTubeDiagonal class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.expiredMedicine" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow :value="dataCard.expiredMedicineDesc" prefix="-" />
              since last week
            </p>
          </CardContent>
        </Card>
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
            <CardTitle>Expiring Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpiringMedicines />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
