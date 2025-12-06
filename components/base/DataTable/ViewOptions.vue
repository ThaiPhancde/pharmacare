<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'

interface DataTableViewOptionsProps<T = any> {
  table: Table<T>
}

const props = defineProps<DataTableViewOptionsProps>()

const columns = computed(() => props.table.getAllColumns()
  .filter(
    column =>
      typeof column.accessorFn !== 'undefined' && column.getCanHide(),
  ))

// Format column name for display
const formatColumnName = (columnId: string) => {
  // Get the column from table
  const column = props.table.getAllColumns().find(col => col.id === columnId)
  if (column?.columnDef?.header) {
    // If header is a string, use it directly
    if (typeof column.columnDef.header === 'string') {
      return column.columnDef.header
    }
    // If header is a function, we can't easily extract the title
    // So we'll format the column id instead
  }
  // Fallback: format the column id to a readable label
  return formatIdToLabel(columnId)
}

const formatIdToLabel = (id: string) => {
  // Handle nested keys like "contact_info.phone" -> "Phone"
  if (id.includes('.')) {
    const parts = id.split('.')
    const lastPart = parts[parts.length - 1]
    // Capitalize first letter and replace underscores
    return lastPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  // Handle snake_case or camelCase
  return id
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim()
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="ml-auto hidden h-8 lg:flex"
      >
        <Icon name="i-radix-icons-mixer-horizontal" class="mr-2 h-4 w-4" />
        View
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[220px] max-h-[400px] overflow-y-auto">
      <DropdownMenuLabel class="sticky top-0 bg-background z-10">Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        class="capitalize break-words whitespace-normal"
        :checked="column.getIsVisible()"
        @update:checked="(value) => column.toggleVisibility(!!value)"
      >
        <span class="text-sm">{{ formatColumnName(column.id) }}</span>
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
