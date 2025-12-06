<template>
  <div class="min-w-full">
    <n-data-table
      :columns="columns"
      :data="medicineRows"
      :pagination="false"
      bordered
    />
  </div>
</template>

<script setup lang="jsx">
import { NInput, NSelect, NDatePicker, NIcon, NInputNumber } from "naive-ui";
import { Trash2 } from "lucide-vue-next";

const medicineOptions = ref([]);
const spinMedicine = ref(false);
const fetchMedicine = async () => {
  spinMedicine.value = true;
  const resData = await api.get("/api/medicine", {
    params: { limit: 99999 },
  });
  if (resData.status) {
    medicineOptions.value = resData.data.map((item) => ({
      label: item.name,
      value: item._id,
      bar_code: item.bar_code,
    }));
  }
  spinMedicine.value = false;
};

const medicineRows = defineModel("value");

onMounted(() => {
  fetchMedicine();
});

function createRow() {
  return {
    id: crypto.randomUUID(),
    medicine: null,
    batchId: null,
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

const handleSelectMedicine = (value, option, row) => {
  row.medicine = value;
  row.batchId = option.bar_code;
};

const columns = [
  {
    title: "Medicine Info",
    key: "medicine",
    minWidth: 240,
    render: (row) =>
      h(NSelect, {
        filterable: true,
        clearable: true,
        loading: spinMedicine.value,
        options: medicineOptions.value,
        fallbackOption: false,
        value: row.medicine,
        placeholder: "Select medicine",
        onUpdateValue: (v, option) => handleSelectMedicine(v, option, row),
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
        min: 0,
        onUpdateValue: (v) => (row.stockQty = +v),
      }),
  },
  {
    title: "Box Pattern",
    key: "boxPattern",
    width: 120,
    render: (row) =>
      h(NInput, {
        value: row.boxPattern,
        placeholder: "Input pattern...",
        onUpdateValue: (v) => (row.boxPattern = v),
      }),
  },
  {
    title: "Box Qty",
    key: "boxQty",
    width: 120,
    render: (row) =>
      h(NInputNumber, {
        value: row.boxQty,
        min: 0,
        onUpdateValue: (v) => (row.boxQty = +v),
      }),
  },
  {
    title: "Qty",
    key: "quantity",
    width: 120,
    render: (row) =>
      h(NInputNumber, {
        value: row.quantity,
        min: 0,
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
        min: 0,
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
        min: 0,
        onUpdateValue: (v) => (row.boxMrp = +v),
      }),
  },
  {
    title: () => <div class="flex items-center justify-end">Total Price</div>,
    key: "totalPrice",
    minWidth: 180,
    render: (row) => (
      <div class="flex items-center justify-end">
        {formatVND(row.totalPrice)}
      </div>
    ),
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

defineExpose({ addRow });

const removeRow = (id) => {
  medicineRows.value = medicineRows.value.filter((row) => row.id !== id);
};
</script>
