<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { data, form } from "@/models/type_medicine";
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

const dataTable = ref([
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
const formSchema = toTypedSchema(form);
const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    status: false,
  },
});
const generateId = () => "UNIT" + Math.floor(1000 + Math.random() * 9000);

const onSubmit = formValue.handleSubmit((values) => {
  try {
    const newCustomer = {
      ...values,
      id: generateId(),
    };
    dataTable.value = [...dataTable.value, newCustomer]; // ✅ Đảm bảo Vue phản ứng
    showAdd.value = false;
  } catch (error) {
    console.log("(❁´◡`❁)😒😒😒 ~ onSubmit ~ error:", error);
  }
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Type List</h2>
      </div>
      <Button @click="() => (showAdd = true)"> Add </Button>
    </div>
    <DataTable :data="dataTable" :columns />
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Add Type</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
          </DialogDescription>
        </DialogHeader>
        <AutoForm
          class="flex flex-col gap-2"
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
