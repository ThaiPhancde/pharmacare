<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { category, form } from "@/models/category";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

const statuses = [
  {
    value: true,
    label: "Active",
    icon: "check-circle",
  },
  {
    value: false,
    label: "Inactive",
    icon: "check-circle",
  },
];

const data = ref([
  {
    id: "CUST001",
    name: "Alice Johnson",
    status: true,
  },
  {
    id: "CUST002",
    name: "Bob Smith",
    status: false,
  },
  {
    id: "CUST003",
    name: "Charlie Brown",
    status: true,
  },
]);

const columns = ref([
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      );

      if (!status) return null;

      return h("div", { class: "flex items-center" }, [
        // status.icon &&
        // h(status.icon, { class: "mr-2 h-4 w-4 text-muted-foreground" }),
        h("span", status.label),
      ]);
    },
  },
]);

const showAdd = ref(false);
const formSchema = toTypedSchema(category);
const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    description: "",
  },
});
const generateId = () => "CUST" + Math.floor(1000 + Math.random() * 9000);

const onSubmit = formValue.handleSubmit((values) => {
  const newCustomer = {
    id: generateId(),
    name: values.name,
    description: values.description,
  };
  data.value = [...data.value, newCustomer]; // ✅ Đảm bảo Vue phản ứng
  showAdd.value = false;
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Category List</h2>
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
        <AutoForm class="flex flex-col gap-2"
          :form="formValue"
          :schema="form"
          @submit="onSubmit"
        >
          <div class="col-span-2 flex justify-center items-center mt-4">
            <Button type="submit"> Send now </Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped></style>
