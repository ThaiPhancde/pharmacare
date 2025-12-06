<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import { computed } from "vue";
// import DataTableFacetedFilter from './FacetedFilter.vue'
import DataTableViewOptions from './ViewOptions.vue'

interface DataTableToolbarProps<T = any> {
  table: Table<T>;
  filterKey: string;
  placeholder: string;
}

const props = defineProps<DataTableToolbarProps>();

const isFiltered = computed(
  () => props.table.getState().columnFilters.length > 0
);
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        :placeholder="props.placeholder"
        :model-value="
          (table.getColumn(props.filterKey)?.getFilterValue() as string) ?? ''
        "
        class="h-8 w-[150px] lg:w-[250px]"
        @input="
          table.getColumn(props.filterKey)?.setFilterValue($event.target.value)
        "
      />

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        Reset
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <DataTableViewOptions :table="table" />
  </div>
</template>
