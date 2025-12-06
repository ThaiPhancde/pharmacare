<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Returns Management</h1>
        <p class="text-gray-500 dark:text-gray-400">
          View all customer and supplier returns
        </p>
      </div>
      
      <div class="flex gap-2">
        <n-button @click="navigateToAdd('customer')">
          New Customer Return
        </n-button>
        <n-button @click="navigateToAdd('supplier')">
          New Supplier Return
        </n-button>
      </div>
    </div>

    <!-- Combined Returns List -->
    <n-card title="All Returns" class="mt-4">
      <n-data-table
        :columns="columns"
        :data="allReturns"
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
import { NTag } from 'naive-ui';
import { h } from 'vue';
import { api } from '@/utils/api';

const route = useRoute();
const router = useRouter();

// State
const loading = ref(false);
const allReturns = ref<any[]>([]);
const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50],
  onChange: (page: number) => {
    pagination.value.page = page;
    fetchAllReturns();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchAllReturns();
  }
});

// Define columns for the combined table
const columns: DataTableColumns<any> = [
  {
    title: 'Return Number',
    key: 'returnNumber',
    sorter: 'default',
    width: 150
  },
  {
    title: 'Type',
    key: 'type',
    width: 100,
    render: (row) => {
      const isCustomerReturn = row.invoice ? true : false;
      return h(
        NTag,
        {
          type: isCustomerReturn ? 'success' : 'info',
          round: true
        },
        { default: () => isCustomerReturn ? 'Customer' : 'Supplier' }
      );
    }
  },
  {
    title: 'Reference',
    key: 'reference',
    render: (row) => {
      if (row.invoice) {
        return row.invoice?.invoice_no || 'N/A';
      } else if (row.purchase) {
        return row.purchase?.invoice_no || 'N/A';
      }
      return 'N/A';
    }
  },
  {
    title: 'Customer/Supplier',
    key: 'party',
    render: (row) => {
      if (row.customer) {
        return row.customer?.full_name || 'Walk-in Customer';
      } else if (row.supplier) {
        return row.supplier?.name || 'Unknown Supplier';
      }
      return 'N/A';
    }
  },
  {
    title: 'Return Date',
    key: 'returnDate',
    render: (row) => new Date(row.returnDate).toLocaleDateString(),
    sorter: (a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime()
  },
  {
    title: 'Items',
    key: 'itemCount',
    width: 80,
    render: (row) => row.items?.length || 0
  },
  {
    title: 'Total Amount',
    key: 'totalAmount',
    render: (row) => new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0 
    }).format(row.totalAmount || 0),
    sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0)
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => {
      const statusMap: Record<string, any> = {
        'pending': { type: 'warning', label: 'Pending' },
        'completed': { type: 'success', label: 'Completed' },
        'cancelled': { type: 'error', label: 'Cancelled' }
      };
      
      const status = statusMap[row.status?.toLowerCase()] || { type: 'default', label: row.status };
      
      return h(
        NTag,
        {
          type: status.type,
          round: true
        },
        { default: () => status.label }
      );
    }
  },
  {
    title: 'Reason',
    key: 'reason',
    ellipsis: {
      tooltip: true
    }
  }
];

// Fetch all returns (both customer and supplier)
const fetchAllReturns = async () => {
  loading.value = true;
  try {
    // Fetch both customer and supplier returns in parallel
    const [customerReturnsRes, supplierReturnsRes] = await Promise.all([
      api.get('/api/returns/customer'),
      api.get('/api/returns/supplier')
    ]);
    
    const customerReturns = customerReturnsRes.status && customerReturnsRes.data 
      ? (Array.isArray(customerReturnsRes.data) ? customerReturnsRes.data : [])
      : [];
      
    const supplierReturns = supplierReturnsRes.status && supplierReturnsRes.data
      ? (Array.isArray(supplierReturnsRes.data) ? supplierReturnsRes.data : [])
      : [];
    
    // Combine and sort by date (newest first)
    allReturns.value = [...customerReturns, ...supplierReturns].sort((a, b) => {
      return new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime();
    });
    
  } catch (error) {
    console.error('Error fetching returns:', error);
    allReturns.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle page change
const handlePageChange = (page: number) => {
  pagination.value.page = page;
};

// Navigate to the respective add page
function navigateToAdd(type: 'customer' | 'supplier') {
  console.log(`Navigating to ${type} add page`);
  router.push(`/returns/${type}/add`);
}

// Fetch data on mount
onMounted(() => {
  fetchAllReturns();
});

// Update the document title
useHead({
  title: 'Returns Management'
});
</script> 