<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { customerSchema } from "@/models/customer";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";

const data = ref([
  {
    id: "CUST001",
    name: "Alice Johnson",
    address: "456 Elm St",
    phone: "+11234567890",
    mail: "alice.johnson@example.com",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "USA",
    balance: 200.5,
  },
  {
    id: "CUST002",
    name: "Bob Smith",
    address: "789 Oak St",
    phone: "+19876543210",
    mail: "bob.smith@example.com",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    country: "USA",
    balance: 320.75,
  },
  {
    id: "CUST003",
    name: "Charlie Brown",
    address: "101 Maple St",
    phone: "+12125551234",
    mail: "charlie.brown@example.com",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "USA",
    balance: 150.0,
  },
]);

const columns = ref([
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "mail", header: "Email" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "city", header: "City" },
  {
    accessorKey: "balance",
    header: "Balance ($)",
    cell: (row: any) => {
      return `$${row?.row?.original?.balance?.toFixed(2)}`;
    },
  },
]);

const showAdd = ref(false);
const formSchema = toTypedSchema(customerSchema);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    address: "",
    phone: "",
    mail: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    balance: 0,
  },
});
const generateId = () => "CUST" + Math.floor(1000 + Math.random() * 9000);

const onSubmit = form.handleSubmit((values) => {
  const newCustomer = {
    id: generateId(),
    name: values.name,
    address: values.address ?? "", // ✅ Đảm bảo string không undefined
    phone: values.phone ?? "",
    mail: values.mail ?? "",
    city: values.city ?? "",
    state: values.state ?? "",
    zip: values.zip ?? "",
    country: values.country ?? "",
    balance: values.balance ?? 0, // ✅ Số không undefined
  };
  data.value = [...data.value, newCustomer]; // ✅ Đảm bảo Vue phản ứng
  showAdd.value = false;
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Customer List</h2>
      </div>
      <Button @click="() => (showAdd = true)"> Add </Button>
    </div>
    <DataTable :data :columns />
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Add Customer</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
          </DialogDescription>
        </DialogHeader>
        <AutoForm :form="form" :schema="customerSchema" @submit="onSubmit">
          <div class="my-2 flex justify-center items-center">
            <Button type="submit"> Send now </Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped></style>
