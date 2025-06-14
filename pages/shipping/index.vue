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
      <n-button class="mt-2" @click="fetchShippingOrders">Retry</n-button>
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

// Table columns
const columns = [
  {
    title: 'Shipping Code',
    key: 'shipping_code',
    render: (row: ShippingOrder) => {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => router.push(`/shipping/track?code=${row.shipping_code}`)
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
          text: true,
          type: 'info',
          onClick: () => router.push(`/invoice/${row.invoice?._id || row.invoice}`)
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
    title: 'Address',
    key: 'recipient_address',
    render: (row: ShippingOrder) => {
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () => h('span', { class: 'truncate block max-w-xs' }, row.recipient_address),
          default: () => row.recipient_address
        }
      );
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: ShippingOrder) => {
      const statusColors: Record<string, string> = {
        'pending': 'warning',
        'confirmed': 'success',
        'shipping': 'info',
        'delivered': 'success',
        'cancelled': 'error'
      };
      
      return h(
        NTag,
        {
          type: statusColors[row.status] || 'default',
          round: true
        },
        { default: () => row.status.charAt(0).toUpperCase() + row.status.slice(1) }
      );
    }
  },
  {
    title: 'Expected Delivery',
    key: 'expected_delivery_date',
    render: (row: ShippingOrder) => {
      if (!row.expected_delivery_date) return 'Chưa xác định';
      
      // Check if delivery is in HCM (districts 1442-1480)
      const isHCMCity = row.district_id >= 1442 && row.district_id <= 1480;
      
      if (isHCMCity) {
        return 'Trong ngày (3-5 tiếng)';
      }
      
      // Format date
      const date = new Date(row.expected_delivery_date);
      if (isNaN(date.getTime())) return 'Chưa xác định';
      
      // Calculate if it's today, tomorrow, or later
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Hôm nay';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Ngày mai';
      } else {
        // Format as date
        return new Intl.DateTimeFormat('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      }
    }
  },
  {
    title: 'Fee',
    key: 'shipping_fee',
    render: (row: ShippingOrder) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.shipping_fee);
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
              size: 'small',
              onClick: () => router.push(`/shipping/track?code=${row.shipping_code}`)
            },
            { default: () => 'Track' }
          )
        ]
      );
    }
  }
];

// Fetch shipping orders
const fetchShippingOrders = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/api/shipping');
    
    if (response.status && response.data) {
      shippingOrders.value = response.data;
    } else {
      error.value = response.message || 'Failed to fetch shipping orders';
    }
  } catch (err) {
    console.error('Error fetching shipping orders:', err);
    error.value = err.message || 'An error occurred while fetching shipping orders';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchShippingOrders();
});
</script> 