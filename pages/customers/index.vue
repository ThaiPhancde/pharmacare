<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { Pencil, Trash, Plus, Eye } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import { form, type Customer } from "@/models/customer";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
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
const formSchema = toTypedSchema(form);

const showDelete = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    customer_id: "",
    full_name: "",
    contact_info: {
      phone: "",
      email: "",
      address: "",
    },
    medical_profile: {
      chronic_conditions: [],
      allergies: [],
      current_medications: [],
    },
    notes: "",
  },
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
  
  formValue.setValues({
    customer_id: item.customer_id || '',
    full_name: item.full_name || '',
    contact_info: {
      phone: item.contact_info?.phone || '',
      email: item.contact_info?.email || '',
      address: item.contact_info?.address || '',
    },
    medical_profile: {
      chronic_conditions: chronicConditionsStr ? [chronicConditionsStr] : [''],
      allergies: allergiesStr ? [allergiesStr] : [''],
      current_medications: currentMedicationsStr ? [currentMedicationsStr] : [''],
    },
    notes: item.notes || '',
  });
  showAdd.value = true;
};

const confirmDelete = async () => {
  if (!selectedCustomer.value) return;
  const res = await api.delete(`/api/customers/${selectedCustomer.value._id}`);
  if (res.status) {
    toast({ title: "Successfully deleted" });
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

  formValue.resetForm({
    values: {
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
    },
  });

  showAdd.value = true;
};

// Handle form submission directly
const onSubmit = formValue.handleSubmit(async (values) => {
  console.log("Form submitted with values:", values);
  
  // Process medical profile data - convert comma-separated strings to arrays
  const processedValues = {
    ...values,
    medical_profile: {
      chronic_conditions: values.medical_profile.chronic_conditions.length > 0 && values.medical_profile.chronic_conditions[0] ? 
        values.medical_profile.chronic_conditions[0].split(',').map(item => item.trim()).filter(item => item) : [],
      allergies: values.medical_profile.allergies.length > 0 && values.medical_profile.allergies[0] ? 
        values.medical_profile.allergies[0].split(',').map(item => item.trim()).filter(item => item) : [],
      current_medications: values.medical_profile.current_medications.length > 0 && values.medical_profile.current_medications[0] ? 
        values.medical_profile.current_medications[0].split(',').map(item => item.trim()).filter(item => item) : [],
    }
  };

  console.log("Processed values:", processedValues);
  
  try {
    let response;
    if (selectedCustomer.value) {
      // Update customer
      console.log("Updating customer:", selectedCustomer.value._id);
      response = await api.put(`/api/customers/${selectedCustomer.value._id}`, processedValues);
    } else {
      // Add new customer
      console.log("Adding new customer");
      response = await api.post("/api/customers", processedValues);
    }

    console.log("API response:", response);
    
    if (response.status) {
      toast({ title: selectedCustomer.value ? "Successfully updated" : "Successfully added" });
      await fetchData();
      showAdd.value = false;
      selectedCustomer.value = null;
      formValue.resetForm();
    } else {
      toast({ 
        title: "Error", 
        description: response.message || "An error occurred",
        variant: "destructive" 
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    toast({ 
      title: "Error", 
      description: "Failed to save customer data",
      variant: "destructive" 
    });
  }
});

const saveCustomer = async () => {
  try {
    const values = formValue.values;
    console.log("Full name value:", values.full_name);
    
    // Đơn giản hóa việc kiểm tra - chấp nhận bất kỳ input nào
    if (values.full_name === undefined) {
      values.full_name = ""; // Đặt giá trị mặc định nếu undefined
    }
    
    // Process medical profile data - convert comma-separated strings to arrays
    const processedValues = {
      ...values,
      full_name: values.full_name || "",  // Đảm bảo full_name không null/undefined
      medical_profile: {
        chronic_conditions: values.medical_profile?.chronic_conditions?.length > 0 && values.medical_profile.chronic_conditions[0] ? 
          values.medical_profile.chronic_conditions[0].split(',').map(item => item.trim()).filter(item => item) : [],
        allergies: values.medical_profile?.allergies?.length > 0 && values.medical_profile.allergies[0] ? 
          values.medical_profile.allergies[0].split(',').map(item => item.trim()).filter(item => item) : [],
        current_medications: values.medical_profile?.current_medications?.length > 0 && values.medical_profile.current_medications[0] ? 
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
      toast({ title: selectedCustomer.value ? "Successfully updated" : "Successfully added" });
      
      // Force a complete refresh of data
      pagination.page = 1; // Reset to first page to ensure we see the new/updated entry
      await fetchData();
      
      showAdd.value = false;
      selectedCustomer.value = null;
      formValue.resetForm();
    } else {
      toast({ 
        title: "Error", 
        description: response.message || "An error occurred",
        variant: "destructive" 
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    toast({ 
      title: "Error", 
      description: "Failed to save customer data",
      variant: "destructive" 
    });
  }
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Customer List</h2>
      </div>
      <Button @click="handleAdd">
        <Plus class="mr-2 h-4 w-4" />
        Add Customer
      </Button>
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
    <Dialog v-model:open="showView">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>
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
              <table class="w-full border-collapse mt-1">
                <thead>
                  <tr class="bg-muted">
                    <th class="border p-1 text-left">Medicine</th>
                    <th class="border p-1 text-center">Qty</th>
                    <th class="border p-1 text-center">Unit</th>
                    <th class="border p-1 text-center">Prescription</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, j) in purchase.items" :key="j">
                    <td class="border p-1">{{ item.medicine_name }}</td>
                    <td class="border p-1 text-center">{{ item.quantity }}</td>
                    <td class="border p-1 text-center">{{ item.unit }}</td>
                    <td class="border p-1 text-center">{{ item.with_prescription ? 'Yes' : 'No' }}</td>
                  </tr>
                </tbody>
              </table>
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
        <DialogFooter>
          <Button @click="showView = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <!-- Add/Edit Modal -->
    <Dialog v-model:open="showAdd">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {{ selectedCustomer ? 'Edit Customer' : 'Add Customer' }}
          </DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="customer_id">Customer ID</Label>
              <Input
                id="customer_id"
                v-model="formValue.values.customer_id"
                placeholder="Customer ID"
                :readonly="!!selectedCustomer"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="full_name">Full Name</Label>
              <Input
                id="full_name"
                v-model="formValue.values.full_name"
                placeholder="Enter full name"
              />
              <span v-if="formValue.errors.full_name" class="text-xs text-red-500">
                {{ formValue.errors.full_name }}
              </span>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Contact Information</Label>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="phone">Phone</Label>
                <Input
                  id="phone"
                  v-model="formValue.values.contact_info.phone"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="formValue.values.contact_info.email"
                  placeholder="Enter email"
                />
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="address">Address</Label>
              <Input
                id="address"
                v-model="formValue.values.contact_info.address"
                placeholder="Enter address"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Medical Profile</Label>
            
            <div class="space-y-2">
              <Label for="chronic_conditions">Chronic Conditions</Label>
              <Input
                id="chronic_conditions"
                v-model="formValue.values.medical_profile.chronic_conditions[0]"
                placeholder="Enter conditions (comma separated)"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="allergies">Allergies</Label>
              <Input
                id="allergies"
                v-model="formValue.values.medical_profile.allergies[0]"
                placeholder="Enter allergies (comma separated)"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="current_medications">Current Medications</Label>
              <Input
                id="current_medications"
                v-model="formValue.values.medical_profile.current_medications[0]"
                placeholder="Enter medications (comma separated)"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="notes">Notes</Label>
            <Textarea
              id="notes"
              v-model="formValue.values.notes"
              placeholder="Enter notes"
              rows="3"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" @click="showAdd = false">Cancel</Button>
            <Button variant="default" @click="saveCustomer">Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    
    <!-- Delete Modal -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete customer
            <span class="font-semibold text-red-500">{{
              selectedCustomer?.full_name
            }}</span>
            ?
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDelete = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
