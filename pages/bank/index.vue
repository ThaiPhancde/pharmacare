<template>
  <div class="space-y-3">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Bank List</h1>
      <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
        @click="handleAddBank">
        <template #icon>
          <Plus />
        </template>
        Add Bank
      </n-button>
    </div>
    <DataTable :columns="columns" :data="bankData.data" :loading="bankData.loading" :page="bankData.pagination.page"
      :size="bankData.pagination.limit" :total="bankData.pagination.total" @changePage="bankData.handlePageChange" 
      filterKey="bank_name" />
    
    <!-- Add/Edit Bank Modal -->
    <n-modal v-model:show="showAddModal" preset="card" style="width: 500px" :title="selectedBank ? 'Edit Bank Account' : 'Add Bank Account'">
      <div class="bg-white rounded-lg shadow border p-6">
        <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top" label-width="auto"
          require-mark-placement="right-hanging">
          <n-form-item label="Bank Name" path="bank_name">
            <n-input v-model:value="formValue.bank_name" placeholder="Enter bank name" />
          </n-form-item>
          <n-form-item label="Account Name" path="account_name">
            <n-input v-model:value="formValue.account_name" placeholder="Enter account holder name" />
          </n-form-item>
          <n-form-item label="Account Number" path="account_number">
            <n-input v-model:value="formValue.account_number" placeholder="Enter account number" />
          </n-form-item>
          <n-form-item label="Branch" path="branch">
            <n-input v-model:value="formValue.branch" placeholder="Enter branch name" />
          </n-form-item>
          <n-form-item label="QR Code Image" path="qr_image">
            <n-upload :default-upload="false" :max="1" list-type="image-card" :on-change="handleImageChange">
              Upload QR Code
            </n-upload>
            <div v-if="formValue.qr_image" class="mt-2">
              <img :src="formValue.qr_image" alt="QR Code Preview" class="w-32 h-32 object-contain border border-gray-200 rounded" />
            </div>
          </n-form-item>
          <n-form-item label="Status" path="status">
            <n-radio-group v-model:value="formValue.status">
              <n-space>
                <n-radio :value="true">Active</n-radio>
                <n-radio :value="false">Inactive</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          <n-form-item>
            <n-space justify="end">
              <n-button @click="showAddModal = false">Cancel</n-button>
              <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
                @click="saveBank" :loading="isSaving">Save</n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>
    </n-modal>

    <!-- Delete Confirmation Modal -->
    <n-modal v-model:show="showDeleteModal" preset="dialog" type="error" title="Confirm Delete" 
      positive-text="Delete" negative-text="Cancel" 
      @positive-click="confirmDelete" @negative-click="showDeleteModal = false">
      <template #default>
        <div class="py-4">
          Are you sure you want to delete bank account
          <span class="font-semibold text-red-500">{{ selectedBank?.bank_name }}</span>?
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useToast } from '@/components/ui/toast';
import DataTable from '@/components/base/DataTable/index.vue';
import { Pencil, Trash, Plus } from 'lucide-vue-next';
import { usePaginationData } from '@/composables/usePaginationData';
import { api } from '@/utils/api';

const toast = useToast();
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const formRef = ref(null);
const selectedBank = ref(null);
const isSaving = ref(false);

const formValue = ref({
  bank_name: '',
  account_name: '',
  account_number: '',
  branch: '',
  qr_image: null,
  status: true
});

const rules = {
  bank_name: {
    required: true,
    message: 'Please input bank name',
    trigger: 'blur'
  },
  account_name: {
    required: true,
    message: 'Please input account holder name',
    trigger: 'blur'
  },
  account_number: {
    required: true,
    message: 'Please input account number',
    trigger: 'blur'
  }
};

const columns = [
  {
    accessorKey: 'bank_name',
    header: 'Bank Name',
  },
  {
    accessorKey: 'account_name',
    header: 'Account Name',
  },
  {
    accessorKey: 'account_number',
    header: 'Account Number',
  },
  {
    accessorKey: 'branch',
    header: 'Branch',
  },
  {
    accessorKey: 'qr_image',
    header: 'QR Code',
    cell: ({ row }) => {
      if (row.original.qr_image) {
        return h('img', {
          src: row.original.qr_image,
          alt: 'QR Code',
          style: 'width: 50px; height: 50px; border-radius: 6px; border: 1px solid #eee; background: #fafbfc;'
        });
      }
      return '-';
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => row.original.status ? 'Active' : 'Inactive'
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(Pencil, {
          class: 'w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition',
          onClick: () => editBank(row.original),
        }),
        h(Trash, {
          class: 'w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition',
          onClick: () => handleDelete(row.original),
        })
      ]);
    }
  }
];

const fetchBankAccounts = async (params) => {
  try {
    const response = await api.get('/api/bank', {
      params
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    toast.error('Failed to load bank accounts');
    return [];
  }
};

const bankData = usePaginationData(fetchBankAccounts);

const handleImageChange = (options) => {
  const { file } = options;
  if (file.file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      formValue.value.qr_image = e.target.result;
    };
    reader.readAsDataURL(file.file);
  }
};

const handleAddBank = () => {
  selectedBank.value = null;
  resetForm();
  showAddModal.value = true;
};

const saveBank = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }

    try {
      isSaving.value = true;
      let response;
      
      if (selectedBank.value) {
        // Cập nhật bank
        response = await api.put(`/api/bank/${selectedBank.value._id}`, formValue.value);
      } else {
        // Thêm mới bank
        response = await api.post('/api/bank', formValue.value);
      }
      
      if (response.status) {
        // Nếu thành công, reload data
        await bankData.reload();
        toast.success(selectedBank.value ? 'Bank account updated successfully' : 'Bank account added successfully');
        showAddModal.value = false;
        resetForm();
      } else {
        toast.error(response.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error('Failed to save bank account');
    } finally {
      isSaving.value = false;
    }
  });
};

const editBank = (bank) => {
  selectedBank.value = bank;
  formValue.value = { ...bank };
  showAddModal.value = true;
};

const handleDelete = (bank) => {
  selectedBank.value = bank;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!selectedBank.value) return;
  
  try {
    const response = await api.delete(`/api/bank/${selectedBank.value._id}`);
    
    if (response.status) {
      await bankData.reload();
      toast.success('Bank account deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete bank account');
    }
  } catch (error) {
    console.error('Error deleting bank account:', error);
    toast.error('Failed to delete bank account');
  } finally {
    showDeleteModal.value = false;
    selectedBank.value = null;
  }
};

const resetForm = () => {
  formValue.value = {
    bank_name: '',
    account_name: '',
    account_number: '',
    branch: '',
    qr_image: null,
    status: true
  };
};

onMounted(() => {
  bankData.fetchData();
});
</script>

<style scoped>
:deep(.n-form-item) {
  margin-bottom: 12px;
}
</style>