<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Shipping Management</h1>
      <n-button type="primary" @click="router.push('/invoice')">
        Create New Shipping
      </n-button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <n-spin size="large" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
      <p>{{ error }}</p>
      <n-button class="mt-2" @click="loadShippingOrders">Retry</n-button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!shippingOrders.length" class="text-center py-8 bg-gray-50 rounded-lg">
      <div class="text-gray-500 mb-2">
        <div class="text-4xl mb-2">
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5l1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zM18 18c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1z"/>
            </svg>
          </n-icon>
        </div>
        <p>No shipping orders found</p>
      </div>
      <n-button @click="router.push('/invoice')">Create Your First Shipping Order</n-button>
    </div>

    <!-- Data table -->
    <n-card v-else>
      <n-data-table
        :columns="columns"
        :data="shippingOrders"
        :pagination="pagination"
        :bordered="false"
        striped
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { NButton, NTag, NTooltip } from 'naive-ui';

// Define shipping order type
interface ShippingOrder {
  _id: string;
  shipping_code: string;
  invoice: any;
  invoice_display?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  district_id: number;
  ward_code: string;
  status: string;
  expected_delivery_date?: string | Date;
  shipping_fee: number;
  is_cod: boolean;
  payment_method: string;
  cod_amount: number;
}

const router = useRouter();
const api = useApi();

const loading = ref(true);
const error = ref('');
const shippingOrders = ref<ShippingOrder[]>([]);

// Pagination
const pagination = {
  pageSize: 10
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Format date
const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('vi-VN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Table columns
const columns = [
  {
    title: 'Shipping Code',
    key: 'shipping_code',
    render: (row: ShippingOrder) => {
      return h(
        NButton,
        {
          type: 'primary',
          strong: true,
          size: 'small',
          onClick: () => router.push(`/shipping/track?code=${row.shipping_code}`),
          style: 'background-color: #2080f0 !important; color: white !important'
        },
        { default: () => row.shipping_code }
      );
    }
  },
  {
    title: 'Invoice',
    key: 'invoice',
    render: (row: ShippingOrder) => {
      const invoiceNo = row.invoice_display || (row.invoice?.invoice_no || row.invoice);
      return h(
        NButton,
        {
          type: 'info',
          strong: true,
          size: 'small',
          onClick: () => router.push(`/invoice/${row.invoice?._id || row.invoice}`),
          style: 'background-color: #61affe !important; color: white !important'
        },
        { default: () => invoiceNo }
      );
    }
  },
  {
    title: 'Recipient',
    key: 'recipient_name',
    render: (row: ShippingOrder) => {
      return h(
        'div',
        {},
        [
          h('div', {}, row.recipient_name),
          h('div', { class: 'text-xs text-gray-500' }, row.recipient_phone)
        ]
      );
    }
  },
  {
    title: 'Payment',
    key: 'payment',
    render: (row: ShippingOrder) => {
      return h(
        'div',
        {},
        [
          h(
            NTag,
            { 
              type: row.is_cod ? 'warning' : 'success',
              style: row.is_cod ? 'background-color: #faad14 !important; color: white !important' : 'background-color: #52c41a !important; color: white !important'
            },
            { default: () => row.is_cod ? 'COD' : 'Prepaid' }
          ),
          row.is_cod ? h('div', { class: 'text-xs mt-1' }, `Amount: ${formatCurrency(row.cod_amount)}`) : null
        ]
      );
    }
  },
  {
    title: 'Fee',
    key: 'shipping_fee',
    render: (row: ShippingOrder) => {
      return formatCurrency(row.shipping_fee);
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: ShippingOrder) => {
      const statusMap: Record<string, { color: string, text: string, type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
        'pending': { color: '#d9d9d9', text: 'Pending', type: 'default' },
        'confirmed': { color: '#1890ff', text: 'Confirmed', type: 'info' },
        'shipping': { color: '#faad14', text: 'Shipping', type: 'warning' },
        'delivered': { color: '#52c41a', text: 'Delivered', type: 'success' },
        'cancelled': { color: '#f5222d', text: 'Cancelled', type: 'error' }
      };
      
      const status = statusMap[row.status] || { color: '#d9d9d9', text: row.status, type: 'default' };
      
      return h(
        NTag,
        { 
          type: status.type,
          style: `background-color: ${status.color} !important; color: white !important`
        },
        { default: () => status.text }
      );
    }
  },
  {
    title: 'Expected Delivery',
    key: 'expected_delivery_date',
    render: (row: ShippingOrder) => {
      if (!row.expected_delivery_date) return 'N/A';
      
      return h(
        NTooltip,
        {},
        {
          trigger: () => h('span', {}, formatDate(row.expected_delivery_date as string)),
          default: () => 'Estimated delivery time'
        }
      );
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row: ShippingOrder) => {
      return h(
        'div',
        { class: 'flex gap-2' },
        [
          h(
            NButton,
            {
              type: 'info',
              size: 'small',
              onClick: () => router.push(`/shipping/track?code=${row.shipping_code}`),
              style: 'background-color: #61affe !important; color: white !important'
            },
            { default: () => 'Track' }
          ),
          h(
            NButton,
            {
              type: 'primary',
              size: 'small',
              onClick: () => router.push(`/invoice/${row.invoice?._id || row.invoice}`),
              style: 'background-color: #2080f0 !important; color: white !important'
            },
            { default: () => 'View Invoice' }
          )
        ]
      );
    }
  }
];

// Load shipping orders
const loadShippingOrders = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/api/shipping');
    
    if (response.status && response.data) {
      shippingOrders.value = Array.isArray(response.data) ? response.data : [];
    } else {
      error.value = response.message || 'Failed to load shipping orders';
    }
  } catch (err: any) {
    console.error('Error loading shipping orders:', err);
    error.value = err.message || 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};

onMounted(loadShippingOrders);
</script>

<style scoped>
/* Override Naive UI components to ensure colors always show (not just on hover) */
:deep(.n-button.n-button--primary-type) {
  background-color: #2080f0 !important;
  color: white !important;
}

:deep(.n-button.n-button--info-type) {
  background-color: #61affe !important; 
  color: white !important;
}

:deep(.n-tag.n-tag--primary-type) {
  background-color: #2080f0 !important;
  color: white !important;
}

:deep(.n-tag.n-tag--info-type) {
  background-color: #1890ff !important;
  color: white !important;
}

:deep(.n-tag.n-tag--success-type) {
  background-color: #52c41a !important;
  color: white !important;
}

:deep(.n-tag.n-tag--warning-type) {
  background-color: #faad14 !important;
  color: white !important;
}

:deep(.n-tag.n-tag--error-type) {
  background-color: #f5222d !important;
  color: white !important;
}

:deep(.n-tag.n-tag--default-type) {
  background-color: #d9d9d9 !important;
  color: white !important;
}
</style> 