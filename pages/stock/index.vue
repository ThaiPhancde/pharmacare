<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";
import { ChevronDown, ChevronRight } from "lucide-vue-next";

const { toast } = useToast();

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

// Track expanded rows
const expandedRows = ref(new Set());

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id);
  } else {
    expandedRows.value.add(id);
  }
};

const isRowExpanded = (id) => {
  return expandedRows.value.has(id);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
};

// Custom page change handler
const onPageChange = (page) => {
  pagination.page = page;
  fetchData();
  // Reset expanded rows when changing page
  expandedRows.value.clear();
};

// Handle page size change
const onPageSizeChange = (size) => {
  pagination.limit = size;
  pagination.page = 1; // Reset to first page when changing page size
  fetchData();
  // Reset expanded rows when changing page size
  expandedRows.value.clear();
};

onMounted(fetchData);

const columns = [
  {
    accessorKey: "expand",
    header: "",
    cell: ({ row }) => {
      const id = row.original.medicine?._id + row.original.batch_id;
      return h('div', { class: 'flex items-center justify-center w-8' }, [
        h('button', { 
          onClick: () => toggleRow(id),
          class: 'p-1 rounded hover:bg-gray-100'
        }, [
          h(isRowExpanded(id) ? ChevronDown : ChevronRight, { size: 16 })
        ])
      ]);
    },
  },
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
    accessorKey: "total_unit_quantity",
    header: "Total Units",
  },
];

</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">List Stock</h2>
      <StockExpire />
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <n-spin size="large" />
    </div>

    <!-- Main table -->
    <div v-else class="overflow-x-auto w-full">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="w-8 px-2 py-3 text-left"></th>
            <th class="px-4 py-3 text-left font-medium">Medicine</th>
            <th class="px-4 py-3 text-left font-medium">Batch ID</th>
            <th class="px-4 py-3 text-left font-medium">Total Units</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in dataTable" :key="`${item.medicine?._id}-${item.batch_id}`">
            <tr 
              class="border-b hover:bg-gray-50 cursor-pointer"
              @click="toggleRow(`${item.medicine?._id}${item.batch_id}`)"
            >
              <td class="px-2 py-3 text-center">
                <component :is="isRowExpanded(`${item.medicine?._id}${item.batch_id}`) ? ChevronDown : ChevronRight" class="w-4 h-4" />
              </td>
              <td class="px-4 py-3">{{ item.medicine?.name }}</td>
              <td class="px-4 py-3">{{ item.batch_id }}</td>
              <td class="px-4 py-3">{{ item.total_unit_quantity }}</td>
            </tr>
            <!-- Expanded content -->
            <tr v-if="isRowExpanded(`${item.medicine?._id}${item.batch_id}`)" class="bg-gray-50">
              <td colspan="4" class="p-0">
                <div class="p-4">
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="bg-gray-100 text-xs">
                        <th class="px-3 py-2 text-left font-medium">Expiry Date</th>
                        <th class="px-3 py-2 text-left font-medium">Box Pattern</th>
                        <th class="px-3 py-2 text-left font-medium">Box Qty</th>
                        <th class="px-3 py-2 text-left font-medium">Unit Qty</th>
                        <th class="px-3 py-2 text-left font-medium">Supplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="variant in item.variants" 
                        :key="variant._id" 
                        class="border-b border-gray-200 text-sm"
                      >
                        <td class="px-3 py-2">{{ formatDate(variant.expiry_date) }}</td>
                        <td class="px-3 py-2">{{ variant.box_pattern }}</td>
                        <td class="px-3 py-2">{{ variant.box_quantity }}</td>
                        <td class="px-3 py-2">{{ variant.unit_quantity }}</td>
                        <td class="px-3 py-2">{{ variant.supplier }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>
          <!-- Empty state -->
          <tr v-if="!loading && dataTable.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-500">
              No stock items found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-end mt-4">
      <n-pagination
        v-model:page="pagination.page"
        :page-count="Math.ceil(pagination.total / pagination.limit)"
        :page-size="pagination.limit"
        :page-sizes="[10, 20, 30, 40]"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>
  </div>
</template>
