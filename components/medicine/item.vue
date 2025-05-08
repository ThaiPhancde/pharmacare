<template>
  <div class="min-w-full">
    <n-data-table
      :columns="columns"
      :data="medicineRows"
      :pagination="false"
      bordered
    />

    <div class="flex justify-end mt-4">
      <n-button type="primary" secondary icon="add" @click="addRow">
        Thêm thuốc
      </n-button>
    </div>
  </div>
</template>

<script setup lang="jsx">
import {
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  NIcon,
  NInputNumber,
} from "naive-ui";
import { Trash2 } from "lucide-vue-next";

const boxPatternOptions = [
  { label: "Vỉ 10", value: "leaf10" },
  { label: "Vỉ 12", value: "leaf12" },
];

const medicineRows = defineModel("value");

function createRow() {
  return {
    id: crypto.randomUUID(),
    medicine: "",
    batchId: "",
    expiryDate: null,
    stockQty: 0,
    boxPattern: null,
    boxQty: 0,
    quantity: 0,
    supplierPrice: 0,
    boxMrp: 0,
    totalPrice: 0,
  };
}

const renderLucideIcon = (IconComp) => {
  return h(NIcon, null, {
    default: () =>
      h(IconComp, {
        size: 18,
        stroke: "red",
        strokeWidth: 1.5,
      }),
  });
};

const columns = [
  {
    title: "Medicine Info",
    key: "medicine",
    render: (row) =>
      h(NInput, {
        value: row.medicine,
        placeholder: "Tên thuốc",
        onUpdateValue: (v) => (row.medicine = v),
      }),
  },
  {
    title: "Batch ID",
    key: "batchId",
    render: (row) =>
      h(NInput, {
        value: row.batchId,
        placeholder: "Batch ID",
        onUpdateValue: (v) => (row.batchId = v),
      }),
  },
  {
    title: "Expiry",
    key: "expiryDate",
    render: (row) =>
      h(NDatePicker, {
        value: row.expiryDate,
        type: "date",
        onUpdateValue: (v) => (row.expiryDate = v),
      }),
  },
  {
    title: "Stock Qty",
    key: "stockQty",
    width: 120,
    render: (row) =>
      h(NInputNumber, {
        value: row.stockQty,
        onUpdateValue: (v) => (row.stockQty = +v),
      }),
  },
  {
    title: "Box Pattern",
    key: "boxPattern",
    width: 120,
    render: (row) =>
      h(NSelect, {
        filterable: true,
        clearable: true,
        options: boxPatternOptions,
        value: row.boxPattern,
        placeholder: "Chọn loại vỉ",
        onUpdateValue: (v) => (row.boxPattern = v),
      }),
  },
  {
    title: "Box Qty",
    key: "boxQty",
    render: (row) =>
      h(NInputNumber, {
        value: row.boxQty,
        onUpdateValue: (v) => (row.boxQty = +v),
      }),
  },
  {
    title: "Qty",
    key: "quantity",
    render: (row) =>
      h(NInputNumber, {
        value: row.quantity,
        onUpdateValue: (v) => {
          row.quantity = +v;
          row.totalPrice = row.quantity * row.supplierPrice;
        },
      }),
  },
  {
    title: "Supplier Price",
    key: "supplierPrice",
    render: (row) =>
      h(NInputNumber, {
        value: row.supplierPrice,
        onUpdateValue: (v) => {
          row.supplierPrice = +v;
          row.totalPrice = row.quantity * row.supplierPrice;
        },
      }),
  },
  {
    title: "Box MRP",
    key: "boxMrp",
    render: (row) =>
      h(NInputNumber, {
        value: row.boxMrp,
        onUpdateValue: (v) => (row.boxMrp = +v),
      }),
  },
  {
    title: "Total Price",
    key: "totalPrice",
    render: (row) => row.totalPrice.toFixed(2),
  },
  {
    title: "Action",
    key: "action",
    minWidth: 75,
    render: (row) =>
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
        },
        [
          h(
            NIcon,
            {
              onClick: () => removeRow(row.id),
            },
            {
              default: renderLucideIcon(Trash2),
            }
          ),
        ]
      ),
  },
];

const addRow = () => {
  medicineRows.value?.push(createRow());
};

const removeRow = (id) => {
  medicineRows.value = medicineRows.value.filter((row) => row.id !== id);
};
</script>
