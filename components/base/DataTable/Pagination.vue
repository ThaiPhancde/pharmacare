<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import { computed } from "vue";

interface Props<T = any> {
  table: Table<T>;
  total: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:page", page: number): void;
  (e: "update:size", size: number): void;
}>();

const pageIndex = computed(() => props.table.getState().pagination.pageIndex)
const pageSize = computed(() => props.table.getState().pagination.pageSize)
const totalPages = computed(() => Math.ceil(props.total / pageSize.value))

const updatePage = (index: number) => {
  if (index >= 0 && index < totalPages.value) {
    emit("update:page", index + 1);
  }
};
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} of
      {{ table.getFilteredRowModel().rows.length }} row(s) selected.
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <!-- Rows per page -->
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">Rows per page</p>
        <Select
          :model-value="`${pageSize}`"
          @update:model-value="(value) => emit('update:size', Number(value))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="page in [10, 20, 30, 40, 50]"
              :key="page"
              :value="`${page}`"
            >
              {{ page }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Current page -->
      <div
        class="w-[100px] flex items-center justify-center text-sm font-medium"
      >
        Page {{ pageIndex + 1 }} of {{ totalPages }}
      </div>
      <!-- Pagination controls -->
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          @click="updatePage(0)"
        >
          <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          @click="updatePage(pageIndex - 1)"
        >
          <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          @click="updatePage(pageIndex + 1)"
        >
          <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          @click="updatePage(totalPages - 1)"
        >
          <Icon name="i-radix-icons-double-arrow-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
