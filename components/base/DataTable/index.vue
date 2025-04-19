<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
  VisibilityState,
} from "@tanstack/vue-table";

import { valueUpdater } from "@/lib/utils";
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import DataTablePagination from "./Pagination.vue";
import DataTableToolbar from "./Toolbar.vue";

interface DataTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  filterKey: string;
}
const props = withDefaults(defineProps<DataTableProps>(), {
  filterKey: "name",
});
const emit = defineEmits<{
  (e: 'changePage', page: number, size: number): void;
}>();

const page = defineModel<number>("page", { default: 1 });
const size = defineModel<number>("size", { default: 10 });
const total = defineModel<number>("total", { default: 0 });
const totalPages = computed(() => Math.ceil(total.value / size.value));

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
watch([page, size], () => {
  emit('changePage', page.value, size.value);
});
const updateState =
  <T,>(stateRef: Ref<T>): OnChangeFn<T> =>
  (updaterOrValue: any) =>
    valueUpdater(updaterOrValue, stateRef);
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get pagination() {
      return {
        pageIndex: page.value - 1,
        pageSize: size.value,
        totalPages: totalPages.value,
      };
    },
  },
  pageCount: totalPages.value,
  enableRowSelection: true,
  onSortingChange: updateState(sorting),
  onColumnFiltersChange: updateState(columnFilters),
  onColumnVisibilityChange: updateState(columnVisibility),
  onRowSelectionChange: updateState(rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});
</script>

<template>
  <div class="space-y-4 w-full">
    <DataTableToolbar
      :table="table"
      :filterKey
      placeholder="Search ..."
    />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="props.columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination
      :table="table"
      :total="total"
      @update:page="(p) => (page = p)"
      @update:size="
        (s) => {
          size = s;
          page = 1; // reset về page đầu khi đổi size
        }
      "
    />
  </div>
</template>
