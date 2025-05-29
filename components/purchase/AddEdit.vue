<!-- components/PurchaseInfoForm.vue -->
<template>
  <n-card class="bg-gray-50 border-l-4 border-primary shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-primary">Create New Purchase</h2>
    </div>

    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      class="grid grid-cols-2 gap-4"
    >
      <!-- Basic Info -->
      <n-form-item label="Supplier" path="supplier">
        <n-select
          v-model:value="form.supplier"
          :options="supplierOptions"
          placeholder="Select supplier"
          filterable
        />
      </n-form-item>

      <n-form-item label="Date" path="date">
        <n-date-picker
          v-model:value="form.date"
          type="date"
          clearable
          :is-date-disabled="disablePastDates"
          value-format="timestamp"
        />
      </n-form-item>

      <n-form-item label="Invoice No" path="invoice_no">
        <n-input
          v-model:value="form.invoice_no"
          placeholder="Auto generated"
          disabled
        />
      </n-form-item>

      <n-form-item label="Payment Type" path="payment_type">
        <n-select
          v-model:value="form.payment_type"
          :options="paymentOptions"
          placeholder="Select payment type"
        />
      </n-form-item>

      <!-- Medicine List -->
      <div class="col-span-2">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-primary">Medicine List</h3>
          <n-button type="primary" @click="addMedicineItem" class="bg-primary">
            Add Medicine
          </n-button>
        </div>

        <div
          v-for="(item, index) in form.items"
          :key="index"
          class="mb-4 p-4 border rounded-lg border-gray-200 hover:border-primary transition-colors"
        >
          <div class="grid grid-cols-3 gap-4">
            <n-form-item
              :label="'Medicine ' + (index + 1)"
              :path="'items[' + index + '].medicine'"
            >
              <n-select
                v-model:value="item.medicine"
                :options="medicineOptions"
                placeholder="Select medicine"
                filterable
                @update:value="(val) => handleMedicineSelect(val, index)"
              />
            </n-form-item>

            <n-form-item
              label="Batch ID"
              :path="'items[' + index + '].batch_id'"
            >
              <n-input
                v-model:value="item.batch_id"
                placeholder="Enter batch ID"
                disabled
              />
            </n-form-item>

            <n-form-item
              label="Expiry Date"
              :path="'items[' + index + '].expiry_date'"
            >
              <n-date-picker
                v-model:value="item.expiry_date"
                type="date"
                clearable
                :is-date-disabled="disablePastDates"
              />
            </n-form-item>

            <n-form-item
              label="Box Pattern"
              :path="'items[' + index + '].box_pattern'"
            >
              <n-input
                v-model:value="item.box_pattern"
                placeholder="e.g. 10x10"
              />
            </n-form-item>

            <n-form-item
              label="Box Quantity"
              :path="'items[' + index + '].box_quantity'"
            >
              <n-input-number v-model:value="item.box_quantity" :min="0" />
            </n-form-item>

            <n-form-item
              label="Unit Quantity"
              :path="'items[' + index + '].unit_quantity'"
            >
              <n-input-number
                v-model:value="item.unit_quantity"
                :min="0"
                disabled
                :value="calculateUnitQuantity(item)"
              />
            </n-form-item>

            <n-form-item
              label="Supplier Price"
              :path="'items[' + index + '].supplier_price'"
            >
              <n-input-number v-model:value="item.supplier_price" :min="0" />
            </n-form-item>

            <n-form-item label="MRP" :path="'items[' + index + '].mrp'">
              <n-input-number v-model:value="item.mrp" :min="0" />
            </n-form-item>

            <n-form-item label="VAT (%)" :path="'items[' + index + '].vat'">
              <n-input-number v-model:value="item.vat" :min="0" :max="100" />
            </n-form-item>
          </div>

          <div class="flex justify-end mt-2">
            <n-button
              type="error"
              class="bg-red-500 hover:bg-red-600 text-white"
              @click="removeMedicineItem(index)"
            >
              Remove
            </n-button>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="col-span-2">
        <n-card title="Summary" class="mt-4 border-t-4 border-primary">
          <div class="flex justify-end">
            <div class="grid grid-cols-2 gap-4 min-w-[300px]">
              <div class="text-right text-gray-600">Subtotal:</div>
              <div class="font-medium">{{ formatVND(calculateSubTotal) }}</div>
              <div class="text-right text-gray-600">Total VAT:</div>
              <div class="font-medium">{{ formatVND(calculateTotalVAT) }}</div>
              <div class="text-right font-bold text-primary">Total:</div>
              <div class="font-bold text-primary">
                {{ formatVND(calculateTotal) }}
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Submit buttons -->
      <div class="col-span-2 flex justify-end gap-4 mt-4">
        <n-button
          @click="resetForm"
          class="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >Reset</n-button
        >
        <n-button
          type="primary"
          @click="handleSubmit"
          class="bg-primary hover:bg-primary-dark"
          >Save</n-button
        >
      </div>
    </n-form>
  </n-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { usePaginationData } from "@/composables/usePaginationData";
import { useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

const formRef = ref(null);
const form = ref({
  supplier: null,
  date: Date.now(),
  invoice_no: null,
  payment_type: null,
  items: [
    {
      medicine: null,
      batch_id: null,
      expiry_date: null,
      box_pattern: null,
      box_quantity: 0,
      unit_quantity: 0,
      supplier_price: 0,
      mrp: 0,
      vat: 0,
    },
  ],
});

const supplierOptions = ref([]);
const medicineOptions = ref([]);

const paymentOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank" },
  { label: "Credit", value: "credit" },
];

const medicineMap = ref(new Map()); // Store medicine details for quick lookup

// Fetch medicines using usePaginationData
const {
  data: medicines,
  loading: loadingMedicines,
  fetchData: fetchMedicines,
} = usePaginationData(async ({ page, limit }) => {
  const res = await fetch(
    "/api/medicine?" +
      new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
  );
  const data = await res.json();
  return data.data;
});

// Fetch customers/suppliers using usePaginationData
const {
  data: customers,
  loading: loadingCustomers,
  fetchData: fetchCustomers,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/suppliers", {
    params: { page, limit: 100 }, // Lấy nhiều hơn để có đủ options
  });
  return res.data;
});

// Watch for changes in medicines and customers to update options
watch(
  medicines,
  (newMedicines) => {
    if (newMedicines) {
      // Update options for select
      medicineOptions.value = newMedicines.map((medicine) => ({
        label: medicine.name,
        value: medicine._id,
      }));

      // Store full medicine data for lookup
      medicineMap.value = new Map(
        newMedicines.map((medicine) => [medicine._id, medicine])
      );
    }
  },
  { immediate: true }
);

watch(
  customers,
  (newCustomers) => {
    if (newCustomers) {
      supplierOptions.value = newCustomers.map((customer) => ({
        label: customer.name,
        value: customer._id,
      }));
    }
  },
  { immediate: true }
);

// Function to generate next invoice number
const generateInvoiceNo = async () => {
  try {
    // Get last purchase to determine next invoice number
    const res = await fetch(
      "/api/purchase?" +
        new URLSearchParams({
          page: "1",
          limit: "1",
          sort: "-invoice_no", // Sort by invoice_no in descending order
        })
    );

    const data = await res.json();
    let nextNumber = 1;

    if (data.data && data.data.length > 0) {
      const lastInvoice = data.data[0].invoice_no;
      // Extract number from last invoice (e.g., "INV-001" -> 1)
      const match = lastInvoice.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format new invoice number with leading zeros
    form.value.invoice_no = `INV-${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based number if API fails
    const timestamp = Date.now().toString().slice(-6);
    form.value.invoice_no = `INV-${timestamp}`;
  }
};

// Call generateInvoiceNo when form is created
onMounted(async () => {
  try {
    await Promise.all([
      fetchMedicines({ page: 1, limit: 100 }),
      fetchCustomers({ page: 1, limit: 100 }),
      generateInvoiceNo(),
    ]);
    await fetchData();
  } catch (error) {
    console.error("Error fetching initial data:", error);
    supplierOptions.value = [];
    medicineOptions.value = [];
  }
});

// Calculation functions
const calculateUnitQuantity = (item) => {
  if (!item.box_pattern || !item.box_quantity) return 0;
  const [rows, cols] = item.box_pattern.split("x").map(Number);
  return rows * cols * item.box_quantity;
};

const calculateSubTotal = computed(() => {
  return form.value.items.reduce((total, item) => {
    return total + item.supplier_price * calculateUnitQuantity(item);
  }, 0);
});

const calculateTotalVAT = computed(() => {
  return form.value.items.reduce((total, item) => {
    const itemTotal = item.supplier_price * calculateUnitQuantity(item);
    return total + (itemTotal * item.vat) / 100;
  }, 0);
});

const calculateTotal = computed(() => {
  return calculateSubTotal.value + calculateTotalVAT.value;
});

// Handler functions
const addMedicineItem = () => {
  form.value.items.push({
    medicine: null,
    batch_id: null,
    expiry_date: null,
    box_pattern: null,
    box_quantity: 0,
    unit_quantity: 0,
    supplier_price: 0,
    mrp: 0,
    vat: 0,
  });
};

const removeMedicineItem = (index) => {
  form.value.items.splice(index, 1);
};

const disablePastDates = (ts) => {
  return ts < Date.now();
};

const rules = {
  supplier: {
    required: true,
    message: "Please select supplier",
    trigger: "blur",
  },
  date: {
    required: true,
    message: "Please select date",
    trigger: ["blur", "change"],
    type: "number",
    validator: (rule, value) => {
      return value !== null && value !== undefined && !isNaN(value);
    },
  },
  invoice_no: {
    required: true,
    message: "Please enter invoice number",
    trigger: "blur",
  },
  payment_type: {
    required: true,
    message: "Please select payment type",
    trigger: "change",
  },
  items: {
    type: "array",
    required: true,
    message: "At least one item is required",
    trigger: "change",
    validator: (rule, value) => value && value.length > 0,
  },
  "items[].medicine": {
    required: true,
    message: "Please select medicine",
    trigger: "change",
  },
  "items[].batch_id": {
    required: true,
    message: "Batch ID is required",
    trigger: "blur",
  },
  "items[].expiry_date": {
    required: true,
    message: "Please select expiry date",
    trigger: "change",
  },
  "items[].box_pattern": {
    required: true,
    message: "Please enter box pattern",
    trigger: "blur",
    validator: (rule, value) => {
      if (!value) return false;
      return /^\d+x\d+$/.test(value); // Validates format like "10x10"
    },
  },
  "items[].box_quantity": {
    required: true,
    type: "number",
    min: 1,
    message: "Quantity must be greater than 0",
    trigger: "change",
  },
  "items[].supplier_price": {
    required: true,
    type: "number",
    min: 0,
    message: "Price must be 0 or greater",
    trigger: "change",
  },
  "items[].mrp": {
    required: true,
    type: "number",
    min: 0,
    message: "MRP must be 0 or greater",
    trigger: "change",
  },
  "items[].vat": {
    required: true,
    type: "number",
    min: 0,
    max: 100,
    message: "VAT must be between 0 and 100",
    trigger: "change",
  },
};

const resetForm = async () => {
  form.value = {
    supplier: null,
    date: Date.now(),
    invoice_no: null,
    payment_type: null,
    items: [
      {
        medicine: null,
        batch_id: null,
        expiry_date: null,
        box_pattern: null,
        box_quantity: 0,
        unit_quantity: 0,
        supplier_price: 0,
        mrp: 0,
        vat: 0,
      },
    ],
  };
  await generateInvoiceNo(); // Generate new invoice number after reset
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }

    try {
      // Calculate total for the entire purchase
      const totalAmount = calculateTotal.value;

      // Transform form data to match API structure
      const purchaseData = {
        supplier: form.value.supplier,
        date: form.value.date,
        invoice_no: form.value.invoice_no,
        payment_type: form.value.payment_type,
        total: totalAmount,
        items: form.value.items.map((item) => {
          const unitQty = calculateUnitQuantity(item);
          return {
            medicine: item.medicine,
            batch_id: item.batch_id,
            expiry_date: item.expiry_date,
            box_pattern: item.box_pattern,
            box_quantity: item.box_quantity,
            unit_quantity: unitQty,
            supplier_price: item.supplier_price,
            mrp: item.mrp,
            vat: item.vat,
            total_price: item.supplier_price * unitQty,
          };
        }),
      };
      let result 
      if (route.params.id) {
        const response = await fetch(`/api/purchase/${route.params.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(purchaseData),
        });
        result = await response.json();
      } else {
        // If no ID, generate a new invoice number
        await generateInvoiceNo();
        const response = await fetch("/api/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(purchaseData),
        });
        result = await response.json();
      }


      if (result.status) {
        console.log("Purchase created successfully");
        resetForm();
        router.push("/purchase");
      } else {
        console.error(
          "Purchase creation failed:",
          result.error || result.message
        );
        throw new Error(result.error || result.message || "Transaction failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Error: ${error.message}`);
    }
  });
};

const fetchData = async () => {
  if (!route.params.id) return;
  try {
    const res = await fetch(`/api/purchase/${route.params.id}`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const response = await res.json();
    const data = response.data

    Object.assign(form.value, {
      supplier: data.supplier._id,
      date: data.date,
      invoice_no: data.invoice_no,
      payment_type: data.payment_type,
      items: data.items.map((item) => ({
        medicine: item.medicine._id,
        batch_id: item.batch_id,
        expiry_date: item.expiry_date,
        box_pattern: item.box_pattern,
        box_quantity: item.box_quantity,
        supplier_price: item.supplier_price,
        mrp: item.mrp,
        vat: item.vat,
      })),
    });
  } catch (err) {
    console.error("❌ Lỗi khi fetch purchase:", err.message);
    // Tuỳ bạn muốn hiện toast, alert hay log ra
  }
};

// Handle medicine selection
const handleMedicineSelect = (medicineId, index) => {
  if (!medicineId) {
    form.value.items[index].batch_id = null;
    return;
  }

  const medicine = medicineMap.value.get(medicineId);
  if (medicine) {
    form.value.items[index].batch_id = medicine.bar_code || "";
  }
};

// Format currency
const formatVND = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};
</script>

<style scoped>
.n-form-item {
  margin-bottom: 0;
}

:deep(.n-card) {
  background-color: var(--card-bg-color, #ffffff);
  transition: all 0.3s ease;
}

:deep(.n-card-header) {
  border-bottom: 1px solid var(--border-color, #eaeaea);
}

/* Define custom variables for theme colors */
:root {
  --primary-color: #1890ff;
  --card-bg-color: #f9fafc;
  --border-color: #eaeaea;
}
</style>
