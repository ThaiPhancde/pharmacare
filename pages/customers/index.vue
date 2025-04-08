<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";
import { form, type Customer } from "@/models/customer";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
const { toast } = useToast();

// Column table
const columns = ref([
  { accessorKey: "stt", header: "STT" },
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
const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData<Customer>(async ({ page, limit }) => {
  const res = await api.get<Customer[]>("/api/customers", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

onMounted(fetchData);

// Form handle
const showAdd = ref(false);
const formSchema = toTypedSchema(form);
const formValue = useForm({
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

const onSubmit = formValue.handleSubmit(async (values) => {
  const newCustomer = { ...values };
  const response = await api.post("/api/customers", newCustomer);
  if (response.status) {
    toast({
      title: "Add success",
    });
    await fetchData();
    // navigateTo("/");
  }
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
    <DataTable
      :data="dataTable"
      :columns
      filterKey="name"
      v-model:page="pagination.page"
      @changePage="handlePageChange"
      v-model:size="pagination.limit"
      v-model:total="pagination.total"
    />
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Add Medicine</DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
          </DialogDescription>
        </DialogHeader>
        <AutoForm
          class="grid grid-cols-2 gap-2"
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