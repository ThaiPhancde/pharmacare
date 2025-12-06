<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { Eye } from "lucide-vue-next";
import { type Customer } from "@/models/customer";
import { ref } from "vue";

// Column table
const columns = ref([
  { accessorKey: "stt", header: "No." },
  { accessorKey: "customer_id", header: "Customer ID" },
  { accessorKey: "full_name", header: "Full Name" },
  { 
    accessorKey: "contact_info.phone", 
    header: "Phone",
    cell: ({ row }: any) => {
      return row?.original?.contact_info?.phone || '';
    }
  },
  { 
    accessorKey: "contact_info.email", 
    header: "Email",
    cell: ({ row }: any) => {
      return row?.original?.contact_info?.email || '';
    }
  },
  { 
    accessorKey: "medical_profile.chronic_conditions", 
    header: "Chronic Conditions",
    cell: ({ row }: any) => {
      const conditions = row?.original?.medical_profile?.chronic_conditions;
      if (Array.isArray(conditions) && conditions.length > 0) {
        return conditions.join(', ');
      }
      return '';
    }
  },
  { 
    accessorKey: "medical_profile.allergies", 
    header: "Allergies",
    cell: ({ row }: any) => {
      const allergies = row?.original?.medical_profile?.allergies;
      if (Array.isArray(allergies) && allergies.length > 0) {
        return allergies.join(', ');
      }
      return '';
    }
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const item = row.original;
      return h("div", { class: "flex gap-2" }, [
        h(Eye, {
          class:
            "w-4 h-4 text-green-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleViewDetail(item),
        }),
      ]);
    },
  },
]);

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData<Customer>(async ({ page, limit }) => {
  const res = await api.get<Customer[]>("/api/customers", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

onMounted(fetchData);

// Form handle
const showView = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const handleViewDetail = (item: Customer) => {
  console.log("View detail item:", item);
  
  // Ensure all necessary properties exist
  if (item.medical_profile) {
    console.log("Medical profile:", {
      chronic_conditions: item.medical_profile.chronic_conditions,
      allergies: item.medical_profile.allergies,
      current_medications: item.medical_profile.current_medications
    });
  } else {
    console.log("Medical profile is undefined");
  }
  
  selectedCustomer.value = item;
  showView.value = true;
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-bold tracking-tight">Customer List</h2>
        <p class="text-sm text-gray-500">
          Customers are created automatically during checkout. Manual add/edit is disabled.
        </p>
      </div>
    </div>
    <DataTable
      :data="dataTable"
      :columns
      filterKey="full_name"
      v-model:page="pagination.page"
      @changePage="handlePageChange"
      v-model:size="pagination.limit"
      v-model:total="pagination.total"
    />
    
    <!-- View Detail Modal -->
    <n-modal v-model:show="showView" preset="card" style="width: 600px" title="Customer Details">
      <div v-if="selectedCustomer" class="grid gap-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold mb-1">Customer ID:</h3>
            <p>{{ selectedCustomer.customer_id }}</p>
          </div>
          <div>
            <h3 class="font-semibold mb-1">Full Name:</h3>
            <p>{{ selectedCustomer.full_name }}</p>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Contact Information:</h3>
          <div class="pl-4">
            <p><span class="font-medium">Phone:</span> {{ selectedCustomer.contact_info?.phone || '-' }}</p>
            <p><span class="font-medium">Email:</span> {{ selectedCustomer.contact_info?.email || '-' }}</p>
            <p><span class="font-medium">Address:</span> {{ selectedCustomer.contact_info?.address || '-' }}</p>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Medical Profile:</h3>
          <div class="pl-4">
            <div>
              <p class="font-medium">Chronic Conditions:</p>
              <div v-if="selectedCustomer.medical_profile?.chronic_conditions?.length">
                <ul class="list-disc pl-4">
                  <li v-for="(condition, i) in selectedCustomer.medical_profile.chronic_conditions" :key="i">
                    {{ condition }}
                  </li>
                </ul>
              </div>
              <p v-else>None</p>
            </div>
            
            <div class="mt-2">
              <p class="font-medium">Allergies:</p>
              <div v-if="selectedCustomer.medical_profile?.allergies?.length">
                <ul class="list-disc pl-4">
                  <li v-for="(allergy, i) in selectedCustomer.medical_profile.allergies" :key="i">
                    {{ allergy }}
                  </li>
                </ul>
              </div>
              <p v-else>None</p>
            </div>
            
            <div class="mt-2">
              <p class="font-medium">Current Medications:</p>
              <div v-if="selectedCustomer.medical_profile?.current_medications?.length">
                <ul class="list-disc pl-4">
                  <li v-for="(med, i) in selectedCustomer.medical_profile.current_medications" :key="i">
                    {{ med }}
                  </li>
                </ul>
              </div>
              <p v-else>None</p>
            </div>
          </div>
        </div>
        
        <div v-if="selectedCustomer.purchase_history?.length">
          <h3 class="font-semibold mb-1">Purchase History:</h3>
          <div v-for="(purchase, i) in selectedCustomer.purchase_history" :key="i" class="mb-2 pl-4">
            <p class="font-medium">Date: {{ purchase.date }}</p>
            <n-table :bordered="true" :single-line="false">
              <thead>
                <tr>
                  <th class="text-left">Medicine</th>
                  <th class="text-center">Qty</th>
                  <th class="text-center">Unit</th>
                  <th class="text-center">Prescription</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, j) in purchase.items" :key="j">
                  <td>{{ item.medicine_name }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-center">{{ item.unit }}</td>
                  <td class="text-center">{{ item.with_prescription ? 'Yes' : 'No' }}</td>
                </tr>
              </tbody>
            </n-table>
          </div>
        </div>
        
        <div v-if="selectedCustomer.notes">
          <h3 class="font-semibold mb-1">Notes:</h3>
          <p>{{ selectedCustomer.notes }}</p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Created Date:</h3>
          <p>{{ new Date(selectedCustomer.created_at || Date.now()).toLocaleString() }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <Button variant="outline" @click="showView = false">Close</Button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
:deep(.n-form-item) {
  margin-bottom: 12px;
}
</style>
