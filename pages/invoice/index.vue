<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-vue-next";

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

const columns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
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
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => row.original.items?.length || 0,
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => formatCurrency(row.original.subtotal),
  },
  {
    accessorKey: "vat_total",
    header: "VAT",
    cell: ({ row }) => formatCurrency(row.original.vat_total),
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => formatCurrency(row.original.discount),
  },
  {
    accessorKey: "grand_total",
    header: "Grand Total",
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
];

const navigateToAddInvoice = () => {
  router.push("/invoice/add");
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">Invoice List</h2>
      <Button @click="navigateToAddInvoice">
        <Plus class="mr-2 h-4 w-4" />
        New Invoice
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