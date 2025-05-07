<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";

const statuses = [
  { value: true, label: "🟢 Active" },
  { value: false, label: "🔴 Inactive" },
];

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/purchase", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

onMounted(fetchData);

const columns = [
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier ?? "-",
  },
  {
    accessorKey: "invoice_no",
    header: "Invoice No",
  },
  {
    accessorKey: "payment_type",
    header: "Payment",
    cell: ({ row }) =>
      row.original.payment_type.charAt(0).toUpperCase() +
      row.original.payment_type.slice(1),
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
    const items = row.original.items ?? [];
    const names = items
      .map((item) => item.medicine)
      .filter(Boolean)
      .join(", ");
    const truncated =
      names.length > 50 ? names.slice(0, 50).trim() + "..." : names;
    return h("span", { title: names }, truncated || "-");
  },
  },
  {
    accessorKey: "vat",
    header: "VAT (%)",
    cell: ({ row }) => {
      return "10";
    },
  },
  {
    accessorKey: "total_price",
    header: "Total",
    cell: ({ row }) => {
      const items = row.original.items ?? [];
      const total = items.reduce(
        (sum, item) =>
          sum + (item.supplier_price || 0) * (item.unit_quantity || 0),
        0
      );
      return total.toLocaleString("vi-VN") + "₫";
    },
  },

];

</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">List Purchase</h2>
    </div>

    <DataTable
      :data="dataTable"
      :columns
      filterKey="name"
      v-model:page="pagination.page"
      @changePage="handlePageChange"
      v-model:size="pagination.limit"
      v-model:total="pagination.total"
    />
  </div>
</template>
