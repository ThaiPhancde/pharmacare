<template>
  <div class="w-full border border-gray-200">
    <div
      v-for="(row, index) in summaryRows"
      :key="index"
      class="grid grid-cols-12 border-b last:border-b-0"
    >
      <div class="col-span-9" />
      <div
        class="col-span-2 flex items-center justify-between px-4 py-2 font-medium text-sm text-right"
      >
        {{ row.label }}
      </div>
      <div class="col-span-1 px-2 py-2 flex items-center justify-end">
        <NInputNumber
          v-if="!row.readOnly"
          v-model:value="row.model"
          :min="0"
          size="small"
          class="w-full"
        />
        <NInputNumber
          v-else
          :value="row.model"
          size="small"
          class="w-full"
          readonly
        />
      </div>
      <div v-if="index === 0" class="col-span-0 px-2 py-2">
        <NButton size="small" type="primary" ghost @click="$emit('add-row')">
          <template #icon>
            <Plus />
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NInputNumber, NButton } from "naive-ui";
import { Plus } from "lucide-vue-next";

// dùng defineModel thay vì defineProps + defineEmits
const form = defineModel("form");

const { vat, discount, paid, items } = toRefs(form.value);

const subTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
});
const total = computed(() => subTotal.value + vat.value - discount.value);
const due = computed(() => total.value - paid.value);

const summaryRows = [
  { label: "Sub Total:", model: subTotal, readOnly: true },
  { label: "Vat:", model: vat, readOnly: false },
  { label: "Discount:", model: discount, readOnly: false },
  { label: "Grand Total:", model: total, readOnly: true },
  { label: "Paid Amount:", model: paid, readOnly: false },
  { label: "Due Amount:", model: due, readOnly: true },
];
</script>
