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
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = statuses.find((s) => s.value === row.getValue("status"));
      return h("div", { class: "flex items-center" }, [
        h("span", status?.label),
      ]);
    },
  },
];

</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">List Stock</h2>
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
