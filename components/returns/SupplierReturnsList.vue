<template>
  <div>
    <n-card>
      <n-data-table
        :columns="columns"
        :data="returns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        @update:page="handlePageChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { DataTableColumns } from 'naive-ui';
import type { SupplierReturn } from '~/models/returns';

// State variables
const returns = ref<SupplierReturn[]>([]);
const loading = ref(true);
const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50],
  onChange: (page: number) => {
    pagination.value.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  }
});

// Define table columns
const columns: DataTableColumns<SupplierReturn> = [
  {
    title: 'Return Number',
    key: 'returnNumber',
    sorter: 'default'
  },
  {
    title: 'Purchase',
    key: 'purchaseId',
    render: (row) => row.purchase?.purchaseNumber || row.purchaseId
  },
  {
    title: 'Supplier',
    key: 'supplierId',
    render: (row) => row.supplier?.name || row.supplierId
  },
  {
    title: 'Return Date',
    key: 'returnDate',
    sorter: (a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime()
  },
  {
    title: 'Total Amount',
    key: 'totalAmount',
    render: (row) => `$${row.totalAmount.toFixed(2)}`
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => {
      const statusMap = {
        pending: 'warning',
        completed: 'success',
        cancelled: 'error'
      };
      
      return h(
        NTag,
        {
          type: statusMap[row.status.toLowerCase()] || 'default',
          round: true
        },
        { default: () => row.status }
      );
    }
  },
  {
    title: 'Reason',
    key: 'reason',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row) => {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => {
              navigateToDetails(row.id);
            }
          },
          { default: () => 'View' }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.id)
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error'
                },
                { default: () => 'Delete' }
              ),
            default: () => 'Are you sure you want to delete this return?'
          }
        )
      ]);
    }
  }
];

// Router for navigation
const router = useRouter();

// Fetch supplier returns
const fetchReturns = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/returns/supplier');
    returns.value = data;
  } catch (error) {
    console.error('Error fetching supplier returns:', error);
    returns.value = [];
  } finally {
    loading.value = false;
  }
};

// Navigate to details page
const navigateToDetails = (id: string) => {
  router.push(`/returns/supplier/${id}`);
};

// Handle delete
const handleDelete = async (id: string) => {
  try {
    await $fetch(`/api/returns/supplier/${id}`, {
      method: 'DELETE'
    });
    await fetchReturns();
    window.$message.success('Return deleted successfully');
  } catch (error) {
    console.error('Error deleting return:', error);
    window.$message.error('Failed to delete return');
  }
};

// Handle page change
const handlePageChange = (page: number) => {
  pagination.value.page = page;
};

// Fetch returns on component mount
onMounted(() => {
  fetchReturns();
});
</script> 