<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Bank List</h1>
    </div>
    <div class="flex justify-end items-center mb-4">
      <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold px-6 py-2 rounded flex items-center gap-2" @click="showAddModal = true">
        <Pencil class="w-4 h-4" />
        Add Bank
      </n-button>
    </div>
    <div class="bg-white shadow">
      <DataTable
        :columns="columns"
        :data="filteredBanks"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
        class="px-2 pb-4"
      />
    </div>
    <!-- Add Bank Modal -->
    <n-modal v-model:show="showAddModal" preset="card" style="width: 500px" title="Add Bank Account">
      <div class="bg-white rounded-lg shadow border p-6">
        <n-form
          ref="formRef"
          :model="formValue"
          :rules="rules"
          label-placement="top"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
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
            <n-upload
              :default-upload="false"
              :max="1"
              list-type="image-card"
              :on-change="handleImageChange"
            >
              Upload QR Code
            </n-upload>
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
              <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold" @click="saveBank">Save</n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { useToast } from '@/components/ui/toast';
import DataTable from '@/components/base/DataTable/index.vue';
import { Pencil, Trash } from 'lucide-vue-next';

const toast = useToast();
const showAddModal = ref(false);
const formRef = ref(null);
const loading = ref(false);
const bankAccounts = ref([]);

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
          onClick: () => deleteBank(row.original.id),
        })
      ]);
    }
  }
];

const pagination = ref({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  total: 0
});

const handlePageChange = (page) => {
  pagination.value.page = page;
  fetchBankAccounts();
};

const fetchBankAccounts = async () => {
  loading.value = true;
  try {
    // Mock data for testing
    bankAccounts.value = [
      {
        id: 1,
        bank_name: 'Sample Bank',
        account_name: 'John Doe',
        account_number: '1234567890',
        branch: 'Main Branch',
        qr_image: null,
        status: true
      }
    ];
    
    pagination.value.total = bankAccounts.value.length;
    
    // Uncomment when API is working
    // const response = await fetch('/api/bank');
    // const result = await response.json();
    // if (result.status) {
    //   bankAccounts.value = result.data || [];
    //   pagination.value.total = result.total || 0;
    // } else {
    //   toast.error(result.message || 'Failed to fetch bank accounts');
    // }
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    toast.error('Failed to load bank accounts');
  } finally {
    loading.value = false;
  }
};

const filteredBanks = computed(() => bankAccounts.value);

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

const saveBank = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }
    
    try {
      // For now, we'll just add to our local array
      // Later, this should be replaced with an API call
      const newBank = {
        id: Date.now(),
        ...formValue.value
      };
      
      bankAccounts.value.push(newBank);
      toast.success('Bank account added successfully');
      showAddModal.value = false;
      resetForm();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error('Failed to save bank account');
    }
  });
};

const editBank = (bank) => {
  formValue.value = { ...bank };
  showAddModal.value = true;
};

const deleteBank = (id) => {
  const index = bankAccounts.value.findIndex(bank => bank.id === id);
  if (index !== -1) {
    bankAccounts.value.splice(index, 1);
    toast.success('Bank account deleted successfully');
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
  fetchBankAccounts();
});
</script> 