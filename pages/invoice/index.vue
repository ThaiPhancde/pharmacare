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
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
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
  if (confirm("Bạn có chắc chắn muốn xóa hóa đơn này không?")) {
    try {
      const res = await fetch(`/api/invoice/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.status) {
        toast.success("Xóa hóa đơn thành công");
        fetchData();
      } else {
        toast.error(data.message || "Xóa hóa đơn thất bại");
      }
    } catch (error) {
      toast.error("Xóa hóa đơn thất bại");
      console.error("Failed to delete invoice:", error);
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
      const method = row.original.payment_method || '-';
      return method.charAt(0).toUpperCase() + method.slice(1);
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
    cell: ({ row }) => formatCurrency(row.original.due),
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