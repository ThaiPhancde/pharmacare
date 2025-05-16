<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";

interface ExpiringMedicine {
  _id: string;
  medicineName: string;
  batchId: string;
  daysLeft: number;
  expiryDate: string;
}

const expiringMedicines = ref<ExpiringMedicine[]>([]);
const loading = ref(false);
const { toast } = useToast();

// Days range for filtering expiring medicines
const daysRange = ref(30);

// Dropdown options
const daysOptions = [
  { label: "7 days", value: 7 },
  { label: "15 days", value: 15 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 }
];

// Fetch expiring medicines data
const fetchExpiringMedicines = async () => {
  loading.value = true;
  try {
    const response = await useFetch<{
      status: boolean;
      data?: ExpiringMedicine[];
      error?: string;
      message?: string;
    }>('/api/dashboard/expiring', {
      key: `expiring-${daysRange.value}`,
      query: {
        days: daysRange.value,
        limit: 5 // Show top 5 expiring medicines
      }
    });
    
    const responseData = response.data.value;
    if (responseData?.status && responseData.data) {
      expiringMedicines.value = responseData.data;
    }
  } catch (error) {
    console.error('Error fetching expiring medicines:', error);
    toast({
      title: 'Error',
      description: 'Unable to load expiring medicines data',
      variant: 'destructive',
    });
  } finally {
    loading.value = false;
  }
};

// Watch for changes in days range
watch(daysRange, () => {
  fetchExpiringMedicines();
});

// Fetch data when component is mounted
onMounted(() => {
  fetchExpiringMedicines();
});

// Format status class based on days left
const getStatusClass = (daysLeft: number) => {
  if (daysLeft <= 0) return 'text-red-500';
  if (daysLeft <= 7) return 'text-yellow-500';
  if (daysLeft <= 30) return 'text-orange-400';
  return 'text-green-500';
};

// Format status text
const getStatusText = (daysLeft: number) => {
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft <= 7) return 'Critical';
  if (daysLeft <= 30) return 'Warning';
  return 'Good';
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <Select v-model="daysRange" :options="daysOptions" />
    </div>
    
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner size="md" />
    </div>
    
    <div v-else-if="expiringMedicines.length === 0" class="text-center py-8 text-muted-foreground">
      No medicines expiring in the next {{ daysRange }} days
    </div>
    
    <div v-else>
      <div class="space-y-4">
        <div v-for="medicine in expiringMedicines" :key="medicine._id" class="border rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-medium">{{ medicine.medicineName }}</h4>
            <Badge :class="getStatusClass(medicine.daysLeft)">
              {{ getStatusText(medicine.daysLeft) }}
            </Badge>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-muted-foreground">Batch ID:</div>
            <div>{{ medicine.batchId }}</div>
            
            <div class="text-muted-foreground">Expire Date:</div>
            <div>{{ new Date(medicine.expiryDate).toLocaleDateString() }}</div>
            
            <div class="text-muted-foreground">Duration:</div>
            <div>{{ medicine.daysLeft }} days</div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <NuxtLink to="/stock/expiring" class="text-sm text-blue-500 hover:underline">
          View all
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 