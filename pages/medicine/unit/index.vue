<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { Pencil, Trash } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import { baseSchema } from "@/models/common";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref, h, onMounted } from "vue";
const { toast } = useToast();

const statuses = [
  { value: true, label: "🟢 Active" },
  { value: false, label: "🔴 Inactive" },
];

const showAdd = ref(false);
const showDelete = ref(false);
const selectedUnit = ref(null);

const formSchema = toTypedSchema(baseSchema);
const formValue = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    description: "",
    status: true,
  },
});

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/unit", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

onMounted(fetchData);

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = statuses.find((s) => s.value === row.getValue("status"));
      return h("div", { class: "flex items-center" }, [
        h("span", status?.label),
      ]);
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
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
];

const handleEdit = (item) => {
  selectedUnit.value = item;
  formValue.setValues(item);
  showAdd.value = true;
};

const handleDelete = (item) => {
  selectedUnit.value = item;
  showDelete.value = true;
};

const confirmDelete = async () => {
  if (!selectedUnit.value) return;
  const res = await api.delete(`/api/unit/${selectedUnit.value._id}`);
  if (res.status) {
    toast({ title: "Delete success" });
    await fetchData();
  }
  selectedUnit.value = null;
  showDelete.value = false;
};

const onSubmit = formValue.handleSubmit(async (values) => {
  const payload = { ...values };
  let res;

  if (selectedUnit.value) {
    res = await api.put(
      `/api/unit/${selectedUnit.value._id}`,
      payload
    );
  } else {
    res = await api.post("/api/unit", payload);
  }

  if (res.status) {
    toast({ title: selectedUnit.value ? "Update success" : "Add success" });
    await fetchData();
  }

  formValue.resetForm();
  selectedUnit.value = null;
  showAdd.value = false;
});
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">Unit List</h2>
      <Button @click="() => (showAdd = true)">Add</Button>
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

    <!-- Modal add -->
    <Dialog v-model:open="showAdd">
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            >{{ selectedUnit ? "Edit" : "Add" }} Unit</DialogTitle
          >
          <DialogDescription class="text-xs text-muted-foreground" />
        </DialogHeader>
        <AutoForm
          class="flex flex-col gap-2"
          :form="formValue"
          :schema="baseSchema"
          @submit="onSubmit"
        >
          <div class="col-span-2 flex justify-center items-center mt-4">
            <Button type="submit">Save</Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>

    <!-- Modal delete -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete
            <span class="font-semibold text-red-500">{{
              selectedUnit?.name
            }}</span
            >?
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="ghost" @click="showDelete = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
