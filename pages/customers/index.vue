<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { Pencil, Trash, Plus, Eye } from "lucide-vue-next";
import { type Customer } from "@/models/customer";
import { ref } from "vue";
import { useMessage } from "naive-ui";

const message = useMessage();

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
        h(Pencil, {
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
const showAdd = ref(false);
const showView = ref(false);
const showDelete = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const formErrors = ref<Record<string, string>>({});

// Sử dụng ref thay vì useForm
const formValue = ref({
  customer_id: "",
  full_name: "",
  contact_info: {
    phone: "",
    email: "",
    address: "",
  },
  medical_profile: {
    chronic_conditions: [""],
    allergies: [""],
    current_medications: [""],
  },
  notes: "",
});

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

const handleEdit = (item: Customer) => {
  selectedCustomer.value = item;
  
  console.log("Editing customer item:", item);
  
  // Ensure medical_profile exists and has proper structure
  const medicalProfile = item.medical_profile || {
    chronic_conditions: [],
    allergies: [],
    current_medications: []
  };
  
  // Convert arrays to string with comma separators for form display
  // Safely handle potential undefined or non-array values
  const chronicConditionsArr = Array.isArray(medicalProfile.chronic_conditions) 
    ? medicalProfile.chronic_conditions : [];
  const allergiesArr = Array.isArray(medicalProfile.allergies) 
    ? medicalProfile.allergies : [];
  const currentMedicationsArr = Array.isArray(medicalProfile.current_medications) 
    ? medicalProfile.current_medications : [];
    
  const chronicConditionsStr = chronicConditionsArr.join(', ');
  const allergiesStr = allergiesArr.join(', ');
  const currentMedicationsStr = currentMedicationsArr.join(', ');
  
  console.log("Medical profile prepared for form:", {
    chronic_conditions: chronicConditionsStr,
    allergies: allergiesStr,
    current_medications: currentMedicationsStr
  });
  
  // Cập nhật formValue thay vì sử dụng setValues
  formValue.value = {
    customer_id: item.customer_id || '',
    full_name: item.full_name || '',
    contact_info: {
      phone: item.contact_info?.phone || '',
      email: item.contact_info?.email || '',
      address: item.contact_info?.address || '',
    },
    medical_profile: {
      chronic_conditions: [chronicConditionsStr],
      allergies: [allergiesStr],
      current_medications: [currentMedicationsStr],
    },
    notes: item.notes || '',
  };
  
  showAdd.value = true;
};

const confirmDelete = async () => {
  if (!selectedCustomer.value) return;
  const res = await api.delete(`/api/customers/${selectedCustomer.value._id}`);
  if (res.status) {
    message.success("Successfully deleted");
    await fetchData();
  }
  showDelete.value = false;
  selectedCustomer.value = null;
};

const handleDelete = (item: Customer) => {
  selectedCustomer.value = item;
  showDelete.value = true;
};

const handleAdd = () => {
  selectedCustomer.value = null;

  // Create new customer ID, e.g., KH + timestamp
  const newCustomerId = "KH" + Date.now().toString().slice(-6);

  // Reset form với giá trị mặc định
  formValue.value = {
    customer_id: newCustomerId,
    full_name: '',
    contact_info: {
      phone: '',
      email: '',
      address: '',
    },
    medical_profile: {
      chronic_conditions: [''],
      allergies: [''],
      current_medications: [''],
    },
    notes: '',
  };

  showAdd.value = true;
};

// Validate form đơn giản
const validateForm = () => {
  const errors: Record<string, string> = {};
  
  if (!formValue.value.full_name.trim()) {
    errors.full_name = 'Full name is required';
  }
  
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const saveCustomer = async () => {
  try {
    // Validate form trước khi submit
    if (!validateForm()) {
      return;
    }
    
    const values = formValue.value;
    console.log("Form values:", values);
    
    // Process medical profile data - convert comma-separated strings to arrays
    const processedValues = {
      ...values,
      full_name: values.full_name || "",  // Đảm bảo full_name không null/undefined
      medical_profile: {
        chronic_conditions: values.medical_profile.chronic_conditions[0] ? 
          values.medical_profile.chronic_conditions[0].split(',').map(item => item.trim()).filter(item => item) : [],
        allergies: values.medical_profile.allergies[0] ? 
          values.medical_profile.allergies[0].split(',').map(item => item.trim()).filter(item => item) : [],
        current_medications: values.medical_profile.current_medications[0] ? 
          values.medical_profile.current_medications[0].split(',').map(item => item.trim()).filter(item => item) : [],
      }
    };
    
    console.log("Processed values:", processedValues);
    
    let response;
    if (selectedCustomer.value) {
      // Update customer
      response = await api.put(`/api/customers/${selectedCustomer.value._id}`, processedValues);
    } else {
      // Add new customer
      response = await api.post("/api/customers", processedValues);
    }
    
    console.log("API response:", response);
    
    if (response.status) {
      message.success(selectedCustomer.value ? "Successfully updated" : "Successfully added");
      
      // Force a complete refresh of data
      pagination.page = 1; // Reset to first page to ensure we see the new/updated entry
      await fetchData();
      
      showAdd.value = false;
      selectedCustomer.value = null;
    } else {
      message.error(response.message || "An error occurred");
    }
  } catch (error) {
    console.error("API Error:", error);
    message.error("Failed to save customer data");
  }
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Customer List</h2>
      </div>
      <n-button type="primary" @click="handleAdd">
        <Plus class="mr-2 h-4 w-4" />
        Add Customer
      </n-button>
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
          <n-button @click="showView = false">Close</n-button>
        </div>
      </template>
    </n-modal>
    
    <!-- Add/Edit Modal -->
    <n-modal v-model:show="showAdd" preset="card" style="width: 600px" :title="selectedCustomer ? 'Edit Customer' : 'Add Customer'">
      <n-form>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <n-form-item label="Customer ID">
              <n-input
                v-model:value="formValue.customer_id"
                placeholder="Customer ID"
                :disabled="!!selectedCustomer"
              />
            </n-form-item>
            
            <n-form-item label="Full Name" :validation-status="formErrors.full_name ? 'error' : undefined" :feedback="formErrors.full_name">
              <n-input
                v-model:value="formValue.full_name"
                placeholder="Enter full name"
              />
            </n-form-item>
          </div>
          
          <div class="space-y-2">
            <div class="text-sm mb-2">Contact Information</div>
            <div class="grid grid-cols-2 gap-4">
              <n-form-item label="Phone">
                <n-input
                  v-model:value="formValue.contact_info.phone"
                  placeholder="Enter phone number"
                />
              </n-form-item>
              
              <n-form-item label="Email">
                <n-input
                  v-model:value="formValue.contact_info.email"
                  placeholder="Enter email"
                />
              </n-form-item>
            </div>
            
            <n-form-item label="Address">
              <n-input
                v-model:value="formValue.contact_info.address"
                placeholder="Enter address"
              />
            </n-form-item>
          </div>
          
          <div class="space-y-2">
            <div class="text-sm mb-2">Medical Profile</div>
            
            <n-form-item label="Chronic Conditions">
              <n-input
                v-model:value="formValue.medical_profile.chronic_conditions[0]"
                placeholder="Enter conditions (comma separated)"
              />
            </n-form-item>
            
            <n-form-item label="Allergies">
              <n-input
                v-model:value="formValue.medical_profile.allergies[0]"
                placeholder="Enter allergies (comma separated)"
              />
            </n-form-item>
            
            <n-form-item label="Current Medications">
              <n-input
                v-model:value="formValue.medical_profile.current_medications[0]"
                placeholder="Enter medications (comma separated)"
              />
            </n-form-item>
          </div>
          
          <n-form-item label="Notes">
            <n-input
              v-model:value="formValue.notes"
              type="textarea"
              placeholder="Enter notes"
              :rows="3"
            />
          </n-form-item>
        </div>
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAdd = false">Cancel</n-button>
          <n-button type="primary" @click="saveCustomer">Save</n-button>
        </div>
      </template>
    </n-modal>
    
    <!-- Delete Modal -->
    <n-modal v-model:show="showDelete" preset="dialog" type="error" title="Confirm Delete" positive-text="Delete" negative-text="Cancel" @positive-click="confirmDelete" @negative-click="showDelete = false">
      <template #default>
        <div class="py-4">
          Are you sure you want to delete customer
          <span class="font-semibold text-red-500">{{ selectedCustomer?.full_name }}</span>?
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
