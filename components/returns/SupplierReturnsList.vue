<template>
  <div>
    <n-card>
      <n-data-table
        :columns="columns"
        :data="returns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row._id"
        @update:page="handlePageChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui';
import { h } from 'vue';
import { api } from '@/utils/api';

// State variables
const returns = ref<any[]>([]);
const loading = ref(true);
const message = useMessage();
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
const columns: DataTableColumns<any> = [
  {
    title: 'Return Number',
    key: 'returnNumber',
    sorter: 'default'
  },
  {
    title: 'Purchase',
    key: 'purchaseId',
    render: (row) => row.purchase?.invoice_no || 'Unknown'
  },
  {
    title: 'Supplier',
    key: 'supplierId',
    render: (row) => row.supplier?.name || 'Unknown'
  },
  {
    title: 'Return Date',
    key: 'returnDate',
    render: (row) => new Date(row.returnDate).toLocaleDateString(),
    sorter: (a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime()
  },
  {
    title: 'Total Amount',
    key: 'totalAmount',
    render: (row) => new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0 
    }).format(row.totalAmount || 0)
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => {
      const statusMap: Record<string, any> = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'error'
      };
      
      const statusType = statusMap[row.status.toLowerCase()] || 'default';
      
      return h(
        NTag,
        {
          type: statusType,
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
              navigateToDetails(row._id);
            }
          },
          { default: () => 'View' }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row._id)
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
    const response = await api.get('/api/returns/supplier', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.pageSize
      }
    });
    
    if (response.status && response.data) {
      returns.value = Array.isArray(response.data) ? response.data : [];
    } else {
      returns.value = [];
    }
  } catch (error) {
    console.error('Error fetching supplier returns:', error);
    returns.value = [];
    message.error('Failed to fetch supplier returns');
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
    const response = await api.delete(`/api/returns/supplier/${id}`);
    
    if (response.status) {
      await fetchReturns();
      message.success('Return deleted successfully');
    } else {
      message.error('Failed to delete return');
    }
  } catch (error) {
    console.error('Error deleting return:', error);
    message.error('Failed to delete return');
  }
};

// Handle page change
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchReturns();
};

// Fetch returns on component mount
onMounted(() => {
  fetchReturns();
});
</script> 