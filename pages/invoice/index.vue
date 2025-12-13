<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";
import { Plus, FileText, Edit, Trash } from "lucide-vue-next";
import { h } from 'vue';

const { toast } = useToast();
const router = useRouter();

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/invoice", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

onMounted(fetchData);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Function to get payment details display
const getPaymentDetails = (invoice) => {
  if (!invoice) return '';
  
  let details = '';
  
  // Add payment method
  details += invoice.payment_method ? invoice.payment_method.toUpperCase() : '';
  
  // Add change amount if available for cash payments
  if (invoice.payment_method === 'cash' && 
      invoice.payment_details && 
      invoice.payment_details.change > 0) {
    details += ` (Change: ${formatCurrency(invoice.payment_details.change)})`;
  }
  
  // Add card details for card payments
  if (invoice.payment_method === 'card' && invoice.payment_details) {
    if (invoice.payment_details.card_number) {
      details += ` (${invoice.payment_details.card_number})`;
    }
  }
  
  return details;
};

const viewInvoice = (id) => {
  router.push(`/invoice/${id}`);
};

const editInvoice = (id) => {
  // For now, this just navigates to the detail page
  // This can be expanded to a proper edit form later
  router.push(`/invoice/${id}`);
};

const deleteInvoice = async (id) => {
  if (confirm("Are you sure you want to delete this invoice?")) {
    try {
      // Show loading indicator
      loading.value = true;
      
      const res = await fetch(`/api/invoice/${id}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.status) {
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
        });
        // Reset to page 1 and fetch data again to update the list
        pagination.page = 1;
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
      console.error("Failed to delete invoice:", error);
    } finally {
      loading.value = false;
    }
  }
};

const columns = [
  {
    accessorKey: "_id",
    header: "Invoice ID",
    cell: ({ row }) => row.original._id || "N/A",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      if (!row.original.updatedAt) return "-";
      const date = new Date(row.original.updatedAt);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      if (!row.original.customer) return "Walk-in Customer";
      const customer = row.original.customer;
      return customer.full_name || customer.customer_id || "-";
    },
  },
  {
    accessorKey: "payment_method",
    header: "Payment Method",
    cell: ({ row }) => {
      return getPaymentDetails(row.original);
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => row.original.items?.length || 0,
  },
  {
    accessorKey: "grand_total",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.grand_total),
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => formatCurrency(row.original.paid),
  },
  {
    accessorKey: "due",
    header: "Due",
    cell: ({ row }) => {
      // If payment_details has change, it means customer paid more than total
      if (row.original.payment_method === 'cash' && 
          row.original.payment_details && 
          row.original.payment_details.change > 0) {
        return `0 (Change: ${formatCurrency(row.original.payment_details.change)})`;
      }
      
      // Otherwise show the due amount
      return formatCurrency(row.original.due);
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => h('div', { class: 'flex items-center space-x-2' }, [
      h('button', { 
        class: 'p-2 rounded-full hover:bg-gray-100',
        onClick: () => viewInvoice(row.original._id)
      }, [h(FileText, { class: 'h-4 w-4' })]),
      h('button', { 
        class: 'p-2 rounded-full hover:bg-gray-100',
        onClick: () => deleteInvoice(row.original._id)
      }, [h(Trash, { class: 'h-4 w-4 text-red-500' })])
    ])
  },
];

const navigateToPosInvoice = () => {
  router.push("/invoice/pos");
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">Invoice List</h2>
      <Button @click="navigateToPosInvoice">
        <Plus class="mr-2 h-4 w-4" />
        New POS Invoice
      </Button>
    </div>

    <DataTable
      :data="dataTable"
      :columns="columns"
      filterKey="customer"
      v-model:page="pagination.page"
      @changePage="handlePageChange"
      v-model:size="pagination.limit"
      v-model:total="pagination.total"
    />
  </div>
</template> 