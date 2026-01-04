<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { Eye, Edit, Trash } from "lucide-vue-next";
import { type Customer } from "@/models/customer";
import { ref } from "vue";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();

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
        h(Edit, {
          class:
            "w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleEdit(item),
        }),
        h(Trash, {
          class:
            "w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleDelete(item),
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
const showEdit = ref(false);
const selectedCustomer = ref<Customer | null>(null);

// Form data for editing
const editForm = ref({
  full_name: '',
  contact_info: {
    phone: '',
    email: '',
    address: '',
  },
  medical_profile: {
    chronic_conditions: [] as string[],
    allergies: [] as string[],
    current_medications: [] as string[],
    medical_notes: '', // Free-text notes for AI analysis
    blood_type: '',
    pregnancy_status: false,
    weight: null as number | null,
    age: null as number | null,
  },
  notes: '',
});

const handleViewDetail = (item: Customer) => {
  console.log("View detail item:", item);
  
  // Ensure all necessary properties exist
  if (item.medical_profile) {
    console.log("Medical profile:", {
      chronic_conditions: item.medical_profile.chronic_conditions,
      allergies: item.medical_profile.allergies,
      current_medications: item.medical_profile.current_medications,
      medical_notes: item.medical_profile.medical_notes
    });
  } else {
    console.log("Medical profile is undefined");
  }
  
  selectedCustomer.value = item;
  showView.value = true;
};

const handleEdit = (item: Customer) => {
  selectedCustomer.value = item;
  editForm.value = {
    full_name: item.full_name || '',
    contact_info: {
      phone: item.contact_info?.phone || '',
      email: item.contact_info?.email || '',
      address: item.contact_info?.address || '',
    },
    medical_profile: {
      chronic_conditions: item.medical_profile?.chronic_conditions || [],
      allergies: item.medical_profile?.allergies || [],
      current_medications: item.medical_profile?.current_medications || [],
      medical_notes: item.medical_profile?.medical_notes || '',
      blood_type: item.medical_profile?.blood_type || '',
      pregnancy_status: item.medical_profile?.pregnancy_status || false,
      weight: item.medical_profile?.weight || null,
      age: item.medical_profile?.age || null,
    },
    notes: item.notes || '',
  };
  showEdit.value = true;
};

const handleSaveEdit = async () => {
  if (!selectedCustomer.value) return;
  
  try {
    const res = await api.put(`/api/customers/${selectedCustomer.value._id}`, editForm.value);
    
    if (res.status) {
      toast({
        title: "Thành công",
        description: "Cập nhật khách hàng thành công",
      });
      showEdit.value = false;
      await fetchData();
      // Không reset editForm và selectedCustomer để giữ dữ liệu cho lần edit sau
    } else {
      toast({
        title: "Lỗi",
        description: res.message || "Cập nhật khách hàng thất bại",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    toast({
      title: "Lỗi",
      description: "Cập nhật khách hàng thất bại",
      variant: "destructive",
    });
  }
};

const handleDelete = async (item: Customer) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${item.full_name}"?`)) {
    return;
  }
  
  try {
    const res = await api.delete(`/api/customers/${item._id}`);
    
    if (res.status) {
      toast({
        title: "Thành công",
        description: "Xóa khách hàng thành công",
      });
      pagination.page = 1;
      await fetchData();
    } else {
      toast({
        title: "Lỗi",
        description: res.message || "Xóa khách hàng thất bại",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error deleting customer:", error);
    toast({
      title: "Lỗi",
      description: "Xóa khách hàng thất bại",
      variant: "destructive",
    });
  }
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-bold tracking-tight">Customer List</h2>
        <p class="text-sm text-gray-500">
          Manage your customers. You can view, edit and delete customer information.
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
        
        <div v-if="selectedCustomer.medical_profile?.medical_notes">
          <h3 class="font-semibold mb-1">Medical Notes (AI Analysis):</h3>
          <p class="bg-blue-50 p-3 rounded-lg text-blue-800">{{ selectedCustomer.medical_profile.medical_notes }}</p>
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
    
    <!-- Edit Customer Modal -->
    <n-modal v-model:show="showEdit" preset="card" style="width: 700px" title="Edit Customer">
      <div v-if="selectedCustomer" class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
        <n-form>
          <n-form-item label="Full Name">
            <n-input v-model:value="editForm.full_name" placeholder="Enter full name" />
          </n-form-item>
          
          <h3 class="font-semibold mt-4 mb-2">Contact Information</h3>
          <n-form-item label="Phone">
            <n-input v-model:value="editForm.contact_info.phone" placeholder="Enter phone" />
          </n-form-item>
          <n-form-item label="Email">
            <n-input v-model:value="editForm.contact_info.email" placeholder="Enter email" />
          </n-form-item>
          <n-form-item label="Address">
            <n-input v-model:value="editForm.contact_info.address" placeholder="Enter address" />
          </n-form-item>
          
          <h3 class="font-semibold mt-4 mb-2 text-blue-600">🏥 Medical Profile (AI Analysis)</h3>
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-blue-700 mb-2">
              💡 This medical information will be analyzed by AI when the customer purchases medicine to provide warnings and appropriate usage guidelines.
            </p>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <n-form-item label="Age">
              <n-input-number v-model:value="editForm.medical_profile.age" placeholder="Age" :min="0" :max="150" class="w-full" />
            </n-form-item>
            <n-form-item label="Weight (kg)">
              <n-input-number v-model:value="editForm.medical_profile.weight" placeholder="Weight" :min="0" :max="300" class="w-full" />
            </n-form-item>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <n-form-item label="Blood Type">
              <n-select 
                v-model:value="editForm.medical_profile.blood_type" 
                placeholder="Select blood type"
                :options="[
                  { label: 'A', value: 'A' },
                  { label: 'B', value: 'B' },
                  { label: 'AB', value: 'AB' },
                  { label: 'O', value: 'O' },
                  { label: 'Unknown', value: '' }
                ]"
                clearable
              />
            </n-form-item>
            <n-form-item label="Pregnant">
              <n-switch v-model:value="editForm.medical_profile.pregnancy_status">
                <template #checked>Yes</template>
                <template #unchecked>No</template>
              </n-switch>
            </n-form-item>
          </div>
          
          <n-form-item label="Chronic Conditions (comma separated)">
            <n-dynamic-tags v-model:value="editForm.medical_profile.chronic_conditions" />
            <template #feedback>
              <span class="text-gray-500 text-xs">E.g.: Diabetes, Hypertension, Heart Disease, Liver Disease, Kidney Disease...</span>
            </template>
          </n-form-item>
          <n-form-item label="Drug Allergies (comma separated)">
            <n-dynamic-tags v-model:value="editForm.medical_profile.allergies" />
            <template #feedback>
              <span class="text-gray-500 text-xs">E.g.: Penicillin, Aspirin, Sulfa, Codeine...</span>
            </template>
          </n-form-item>
          <n-form-item label="Current Medications (comma separated)">
            <n-dynamic-tags v-model:value="editForm.medical_profile.current_medications" />
            <template #feedback>
              <span class="text-gray-500 text-xs">E.g.: Metformin, Lisinopril, Warfarin...</span>
            </template>
          </n-form-item>
          
          <n-form-item label="📝 Detailed Medical Notes (AI will analyze)">
            <n-input 
              type="textarea" 
              v-model:value="editForm.medical_profile.medical_notes" 
              placeholder="Enter detailed medical information for AI analysis. E.g.: Patient has type 2 diabetes for 5 years, taking Metformin 500mg twice daily, unstable blood pressure, allergic to penicillin antibiotics..."
              :rows="4"
            />
            <template #feedback>
              <span class="text-blue-500 text-xs">AI will automatically analyze this content to provide warnings when the customer purchases medicine</span>
            </template>
          </n-form-item>
          
          <n-form-item label="Other Notes">
            <n-input type="textarea" v-model:value="editForm.notes" placeholder="Additional notes (non-medical)" :rows="2" />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showEdit = false">Cancel</Button>
          <Button @click="handleSaveEdit">Save Changes</Button>
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
