<script setup lang="ts">
import DataTable from "@/components/base/DataTable/index.vue";
import { Pencil, Trash } from "lucide-vue-next";
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
  { accessorKey: "address", header: "Address" },
  { accessorKey: "city", header: "City" },
  {
    accessorKey: "balance",
    header: "Balance ($)",
    cell: ({ row }: any) => {
      const value = row?.original?.balance ?? 0;
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const item = row.original;
      return h("div", { class: "flex gap-2" }, [
        h(Pencil, {
          class:
            "w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleEdit(item),
        }),
        h(Trash, {
          class:
            "w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleDelete(item),
        }),
      ]);
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

const showDelete = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    phone: "",
    mail: "",
    address: "",
    city: "",
    country: "Vietnam",
    balance: 0,
  },
});

const handleEdit = (item: Customer) => {
  selectedCustomer.value = item;
  formValue.setValues(item); // fill the form
  showAdd.value = true;
};
const confirmDelete = async () => {
  if (!selectedCustomer.value) return;
  const res = await api.delete(`/api/customers/${selectedCustomer.value._id}`);
  if (res.status) {
    toast({ title: "Xoá thành công" });
    await fetchData();
  }
  showDelete.value = false;
  selectedCustomer.value = null;
};

const handleDelete = (item: Customer) => {
  selectedCustomer.value = item;
  showDelete.value = true;
};

const handleAdd = () => {
  selectedCustomer.value = null;

  formValue.resetForm({
    values: {
      name: "",
      phone: "",
      mail: "",
      address: "",
      city: "",
      country: "Vietnam", // default selected
      balance: 0,
    },
  });

  showAdd.value = true;
};

const onSubmit = formValue.handleSubmit(async (values) => {
  const payload = { ...values };

  let response;
  if (selectedCustomer.value) {
    // Update customer
    response = await api.put(`/api/customers/${selectedCustomer.value._id}`, payload);
  } else {
    // Add new customer
    response = await api.post("/api/customers", payload);
  }

  if (response.status) {
    toast({ title: selectedCustomer.value ? "Update success" : "Add success" });
    await fetchData();
  }

  showAdd.value = false;
  selectedCustomer.value = null;
  formValue.resetForm(); // reset form after submit
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Supplier List</h2>
      </div>
      <Button @click="handleAdd"> Add </Button>
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
    <!-- modal thêm -->
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Add Customer</DialogTitle>
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
            <Button type="submit"> Save </Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>
    <!-- modal xoá -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete
            <span class="font-semibold text-red-500">{{
              selectedCustomer?.name
            }}</span>
            ?
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="ghost" @click="showDelete = false">Huỷ</Button>
          <Button variant="destructive" @click="confirmDelete">Xoá</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
