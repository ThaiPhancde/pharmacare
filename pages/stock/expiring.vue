<!-- pages/stock/expiring.vue -->
<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();
const daysRange = ref(30); // Default to show medicines expiring in 30 days

const daysOptions = [
  { label: "7 days", value: 7 },
  { label: "15 days", value: 15 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  try {
    const res = await api.get("/api/stock/expiring", {
      params: { page, limit, days: daysRange.value },
    });
    pagination.total = res.total ?? 0;
    return res.data;
  } catch (error) {
    toast({
      title: "Error",
      description: "Unable to load expiring medicines data",
      variant: "destructive",
    });
    return [];
  }
});

// Watch for changes in daysRange to reload data
watch(daysRange, () => {
  fetchData();
});

const dataTable = computed(() => {
  return responseData.value;
});

// Statistics
const stats = computed(() => {
  if (!responseData.value?.length)
    return { expired: 0, critical: 0, warning: 0, good: 0 };

  const result = { expired: 0, critical: 0, warning: 0, good: 0 };
  responseData.value.forEach((item) => {
    if (item.daysLeft <= 0) result.expired++;
    else if (item.daysLeft <= 7) result.critical++;
    else if (item.daysLeft <= 30) result.warning++;
    else result.good++;
  });

  return result;
});

onMounted(fetchData);

// Format expiry status based on daysLeft from API
const getExpiryStatus = (daysLeft) => {
  if (daysLeft <= 0)
    return {
      text: "Expired",
      color: "text-red-600 font-bold rounded px-2 py-1",
    };
  if (daysLeft <= 7)
    return {
      text: `${daysLeft} days left`,
      color: "text-orange-600 font-bold rounded px-2 py-1",
    };
  if (daysLeft <= 30)
    return {
      text: `${daysLeft} days left`,
      color: "text-yellow-600 rounded px-2 py-1",
    };
  return {
    text: `${daysLeft} days left`,
    color: "text-green-600 rounded px-2 py-1",
  };
};

// Determine row color based on expiry status
const getRowClass = (daysLeft) => {
  if (daysLeft <= 0) return "bg-red-50";
  if (daysLeft <= 7) return "bg-orange-50";
  return "";
};

const columns = [
  {
    accessorKey: "medicine.name",
    header: "Medicine Name",
    cell: ({ row }) => row.original.medicine?.name || "",
  },
  {
    accessorKey: "batch_id",
    header: "Batch ID",
  },
  {
    accessorKey: "expiry_date",
    header: "Expiry Date",
    cell: ({ row }) =>
      row.original.expiry_date
        ? new Date(row.original.expiry_date).toLocaleDateString()
        : "",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = getExpiryStatus(row.original.daysLeft);
      return h("div", { class: status.color }, status.text);
    },
  },
  {
    accessorKey: "box_quantity",
    header: "Box Qty",
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, row.original.box_quantity),
  },
  {
    accessorKey: "unit_quantity",
    header: "Unit Qty",
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, row.original.unit_quantity),
  },
  {
    accessorKey: "purchase.invoice_no",
    header: "Purchase Invoice",
    cell: ({ row }) => row.original.purchase?.invoice_no || "",
  },
  {
    accessorKey: "purchase.supplier.name",
    header: "Supplier",
    cell: ({ row }) => row.original.purchase?.supplier?.name || "",
  },
  {
    accessorKey: "purchase.date",
    header: "Purchase Date",
    cell: ({ row }) =>
      row.original.purchase?.date
        ? new Date(row.original.purchase.date).toLocaleDateString()
        : "",
  },
];
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Expiring Medicines</h2>
        <p class="text-gray-500">
          List of medicines nearing their expiration date
        </p>
      </div>

      <div class="flex items-center gap-2 p-2 rounded-lg shadow-sm">
        <span class="text-sm font-medium">Show medicines expiring in:</span>
        <n-select
          v-model:value="daysRange"
          :options="daysOptions"
          style="width: 120px"
          class="text-primary"
        />
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Expired</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.expired }}</p>
          </div>
          <Icon name="i-lucide-alert-circle" class="h-6 w-6 text-red-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Critical (≤ 7 days)</p>
            <p class="text-2xl font-bold text-orange-600">
              {{ stats.critical }}
            </p>
          </div>
          <Icon
            name="i-lucide-alert-triangle"
            class="h-6 w-6 text-orange-500"
          />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-yellow-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Warning (≤ 30 days)</p>
            <p class="text-2xl font-bold text-yellow-600">
              {{ stats.warning }}
            </p>
          </div>
          <Icon name="i-lucide-clock" class="h-6 w-6 text-yellow-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Good (> 30 days)</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.good }}</p>
          </div>
          <Icon name="i-lucide-check-circle" class="h-6 w-6 text-green-500" />
        </div>
      </n-card>
    </div>

    <!-- Main Table Card -->
    <DataTable
      :data="dataTable"
      :columns="columns"
      filterKey="medicine.name"
      v-model:page="pagination.page"
      @changePage="handlePageChange"
      v-model:size="pagination.limit"
      v-model:total="pagination.total"
      row-class="hover:bg-gray-50 transition-colors"
      :row-class-name="(row) => getRowClass(row.original.daysLeft)"
    />
  </div>
</template>
