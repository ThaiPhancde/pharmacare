<script setup lang="tsx">
import DataTable from "@/components/base/DataTable/index.vue";
import { form } from "@/models/medicine";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";

// Data
const dataTable = ref([
  {
    barcode: "MED001",
    strength: "500mg",
    boxSize: "30",
    shelf: "A1",
    category: "Antibiotic",
    medicineType: "Tablet",
    supplier: "PharmaCorp",
    tax: 5,
    medicineName: "Amoxicillin",
    genericName: "Amoxicillin",
    unit: "Bottle",
    details: "Used for bacterial infections",
    price: 12.5,
    image: null,
    supplierPrice: 8.5,
    discount: 10,
    status: "active",
  },
  {
    barcode: "MED002",
    strength: "250mg",
    boxSize: "20",
    shelf: "B3",
    category: "Painkiller",
    medicineType: "Capsule",
    supplier: "MediSupply",
    tax: 7,
    medicineName: "Ibuprofen",
    genericName: "Ibuprofen",
    unit: "Box",
    details: "Relieves pain and inflammation",
    price: 8.99,
    image: null,
    supplierPrice: 5.99,
    discount: 5,
    status: "active",
  },
  {
    barcode: "MED003",
    strength: "50mg",
    boxSize: "50",
    shelf: "C2",
    category: "Antihistamine",
    medicineType: "Syrup",
    supplier: "HealthCo",
    tax: 6,
    medicineName: "Cetirizine",
    genericName: "Cetirizine Hydrochloride",
    unit: "Bottle",
    details: "Treats allergies and hay fever",
    price: 15.75,
    image: null,
    supplierPrice: 10.5,
    discount: 8,
    status: "inactive",
  },
])


// Column table
const columns = ref([
  { accessorKey: "barcode", header: "Barcode" },
  { accessorKey: "medicineName", header: "Medicine Name" },
  { accessorKey: "genericName", header: "Generic Name" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "medicineType", header: "Medicine Type" },
  { accessorKey: "supplier", header: "Supplier" },
  { accessorKey: "boxSize", header: "Box Size" },
  { accessorKey: "unit", header: "Unit" },
  { accessorKey: "shelf", header: "Shelf Location" },
  {
    accessorKey: "price",
    header: "Price ($)",
    cell: (row: any) => `$${row?.row?.original?.price?.toFixed(2)}`,
  },
  {
    accessorKey: "supplierPrice",
    header: "Supplier Price ($)",
    cell: (row: any) => `$${row?.row?.original?.supplierPrice?.toFixed(2)}`,
  },
  {
    accessorKey: "discount",
    header: "Discount (%)",
    cell: (row: any) => `${row?.row?.original?.discount}%`,
  },
  {
    accessorKey: "tax",
    header: "Tax (%)",
    cell: (row: any) => `${row?.row?.original?.tax}%`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (row: any) =>
      row?.row?.original?.status === "active"
        ? "🟢 Active"
        : "🔴 Inactive",
  },
]);


// Form handle
const showAdd = ref(false);
const formSchema = toTypedSchema(form);
const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    barcode: "",
    strength: "",
    boxSize: "",
    shelf: "",
    category: "",
    medicineType: "",
    supplier: "",
    tax: 15,
    medicineName: "",
    genericName: "",
    unit: "",
    details: "",
    price: "",
    image: null,
    supplierPrice: "",
    discount: 16,
    status: "active",
  },
});
const generateId = () => "CUST" + Math.floor(1000 + Math.random() * 9000);

const onSubmit = formValue.handleSubmit((values) => {
  const newMedicine = {
    ...values,
    id: generateId(),
  };
  dataTable.value = [...dataTable.value, newMedicine]; // ✅ Đảm bảo Vue phản ứng
  showAdd.value = false;
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Medicine List</h2>
      </div>
      <Button @click="() => (showAdd = true)"> Add </Button>
    </div>
    <DataTable :data="dataTable" filterKey="medicineName" :columns />
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Add Medicine</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
          </DialogDescription>
        </DialogHeader>
        <AutoForm
          class="grid grid-cols-3 gap-4"
          :form="formValue"
          :schema="form"
          @submit="onSubmit"
        >
          <div class="col-span-3 flex justify-center items-center mt-4">
            <Button type="submit"> Send now </Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>
  </div>
</template>
