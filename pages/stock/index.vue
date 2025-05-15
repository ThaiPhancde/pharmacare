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
  const res = await api.get("/api/stock", {
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
    accessorKey: "medicine.name",
    header: "Medicine",
    cell: ({ row }) => row.original.medicine?.name || "",
  },
  {
    accessorKey: "batch_id",
    header: "Batch ID",
  },
  {
    accessorKey: "expiry_date",
    header: "Expiry Date",
    cell: ({ row }) => row.original.expiry_date ? new Date(row.original.expiry_date).toLocaleDateString(): "",
  },
  {
    accessorKey: "box_pattern",
    header: "Box Pattern",
  },
  {
    accessorKey: "box_quantity",
    header: "Box Qty",
  },
  {
    accessorKey: "unit_quantity",
    header: "Unit Qty",
  },
  // {
  //   accessorKey: "purchase_price",
  //   header: "Purchase Price",
  //   cell: ({ row }) => formatVND(row.original.purchase_price)
  // },
  // {
  //   accessorKey: "mrp",
  //   header: "MRP",
  //   cell: ({ row }) => formatVND(row.original.mrp)
  // },
  // {
  //   accessorKey: "vat",
  //   header: "VAT (%)",
  // },
];

</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">List Stock</h2>
      <StockExpire  />
    </div>
    <div class="flex justify-end">

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
