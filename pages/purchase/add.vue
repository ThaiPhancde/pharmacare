<!-- components/PurchaseInfoForm.vue -->
<template>
  <n-card>
    <n-form
      :model="form"
      :rules="rules"
      label-placement="top"
      class="grid grid-cols-2 gap-4"
    >
      <n-form-item label="Supplier" path="supplier">
        <n-select
          v-model:value="form.supplier"
          :options="supplierOptions"
          placeholder="Select Supplier"
          filterable
        />
      </n-form-item>

      <n-form-item label="Date" path="date">
        <n-date-picker v-model:value="form.date" type="date" clearable />
      </n-form-item>

      <n-form-item label="Invoice No" path="invoice_no">
        <n-input
          v-model:value="form.invoice_no"
          placeholder="Enter Invoice No"
        />
      </n-form-item>

      <n-form-item label="Payment Type" path="payment_type">
        <n-select
          v-model:value="form.payment_type"
          :options="paymentOptions"
          placeholder="Cash / Bank / Debt"
        />
      </n-form-item>

      <n-form-item label="Details">
        <n-input
          v-model:value="form.details"
          type="textarea"
          placeholder="Optional notes..."
        />
      </n-form-item>
      <n-form-item label="Medicine" :show-label="false" class="col-span-2">
        <div class="flex flex-col gap-2">
          <MedicineItem ref="itemRef" v-model:value="form.items" />
          <MedicineSummary v-model:form="form" @add-row="addMedicine" />
          <div class="flex justify-end">
            <Button class="text-white" @click="addMedicine">
              Add Medicine</Button
            >
          </div>
        </div>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
const form = ref({
  supplier: null,
  date: Date.now(),
  invoice_no: null,
  payment_type: null,
  details: null,
  items: [
    {
      id: 1,
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
    },
  ],
  vat: 0,
  discount: 0,
  total: 0,
  paid: 0,
  due: 0,
}); // expect { supplier, date, invoice_no, payment_type, details }

const itemRef = ref(null);

const supplierOptions = [
  { label: "ABC Pharma", value: "abc" },
  { label: "XYZ Supplier", value: "xyz" },
];

const paymentOptions = [
  { label: "Cash Payment", value: "cash" },
  { label: "Bank Transfer", value: "bank" },
  { label: "Credit", value: "credit" },
];

const addMedicine = () => {
  itemRef.value?.addRow();
};

const rules = {
  supplier: { required: true, message: "Select supplier", trigger: "blur" },
  date: { required: true, message: "Choose date", trigger: "blur" },
  invoice_no: {
    required: true,
    message: "Enter invoice number",
    trigger: "blur",
  },
  payment_type: {
    required: true,
    message: "Choose payment type",
    trigger: "change",
  },
};
</script>
