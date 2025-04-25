<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { Pencil, Trash } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
const { toast } = useToast();

const statuses = [
  { value: true, label: "🟢 Active" },
  { value: false, label: "🔴 Inactive" },
];

const showAdd = ref(false);
const showDelete = ref(false);
const selectedMedicine = ref(null);

const medicineTypes = ref([]);
const units = ref([]);
const categories = ref([]);

const fileList = ref([]);

const formValue = reactive({
  bar_code: null,
  name: null,
  generic: null,
  image: null,
  unit_id: null,
  type_id: null,
  category_id: null,
});

const fetchType = async () => {
  const resData = await api.get("/api/types", { params: { limit: 99999 } });
  if (resData.status) {
    medicineTypes.value = resData.data.map((item) => ({
      label: item.name,
      value: item._id,
    }));
  }
};

const fetchUnit = async () => {
  const resData = await api.get("/api/unit", { params: { limit: 99999 } });
  if (resData.status) {
    units.value = resData.data.map((item) => ({
      label: item.name,
      value: item._id,
    }));
  }
};

const fetchCategories = async () => {
  const resData = await api.get("/api/categories", {
    params: { limit: 99999 },
  });
  if (resData.status) {
    categories.value = resData.data.map((item) => ({
      label: item.name,
      value: item._id,
    }));
  }
};

const preloadFormData = async () => {
  await Promise.all([fetchType(), fetchUnit(), fetchCategories()]);
};

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/medicine", {
    params: { page, limit },
  });
  pagination.total = res.total ?? 0;
  return res.data;
});

const dataTable = computed(() => {
  return responseData.value;
});

const handleShowModalAdd = async () => {
  await preloadFormData();
  showAdd.value = true;
};
const formatVND = (value) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

onMounted(fetchData);

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "generic", header: "Generic Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "category.name", header: "Category" },
  { accessorKey: "type.name", header: "Type" },
  { accessorKey: "unit.name", header: "Unit" },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatVND(row.original.price),
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image; // Assuming 'image' contains the URL or base64 string
      return (
        imageUrl &&
        h("img", {
          src: imageUrl,
          alt: "Medicine Image",
          class: "w-12 h-12 object-fit", // You can style this as per your needs
        })
      );
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

const handleEdit = async (item) => {
  await preloadFormData();
  selectedMedicine.value = item;
  Object.assign(formValue, item); // Sử dụng Object.assign để sao chép giá trị vào formValue
  formValue.category_id = item.category_id?._id
  formValue.unit_id = item.unit_id?._id
  formValue.type_id = item.type_id?._id
  fileList.value = item.image
    ? [
        {
          id: "preview-img",
          name: "image.jpg",
          status: "finished",
          url: item.image,
        },
      ]
    : [];
  showAdd.value = true;
};

const handleDelete = (item) => {
  selectedMedicine.value = item;
  showDelete.value = true;
};

const confirmDelete = async () => {
  if (!selectedMedicine.value) return;
  const res = await api.delete(`/api/medicine/${selectedMedicine.value._id}`);
  if (res.status) {
    toast({ title: "Delete success" });
    await fetchData();
  }
  selectedMedicine.value = null;
  showDelete.value = false;
};

const handleImageUpload = (response) => {
  console.log("🚀 ~ handleImageUpload ~ response:", response);
  // Optionally handle server-side response here if needed
  console.log("Image uploaded", response);
};

const beforeImageUpload = (file) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    formValue.image = reader.result; // Store the base64 result
  };
  reader.readAsDataURL(file); // Convert the file to base64
  return false; // Prevent the default upload behavior
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const handleChangeFile = async (files) => {
  const fileInfo = files[0].file;
  const base64 = await fileToBase64(fileInfo);
  formValue.image = base64;
};

const handleSubmit = async () => {
  const isEditMode = selectedMedicine.value !== null;
  const url = isEditMode
    ? `/api/medicine/${selectedMedicine.value._id}`
    : "/api/medicine";
  const method = isEditMode ? "put" : "post";

  try {
    const res = await api[method](url, formValue);
    if (res.status) {
      toast({ title: isEditMode ? "Update success" : "Add success" });
      await fetchData(); // Refresh data after submit
      showAdd.value = false; // Close modal
    }
  } catch (error) {
    toast({ title: "Error", description: error.message, type: "error" });
  }
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">Medicine List</h2>
      <Button @click="handleShowModalAdd">Add</Button>
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
    <n-modal v-model:show="showAdd" close-on-esc>
      <div class="bg-white min-w-600px p-4 rounded-xl">
        <n-form ref="formRef" :model="formValue">
          <n-form-item label="Bar Code/QR Code" path="bar_code">
            <n-input
              v-model:value="formValue.bar_code"
              placeholder="Bar Code/QR Code"
            />
          </n-form-item>
          <n-form-item label="Generic Name" path="generic">
            <n-input
              v-model:value="formValue.generic"
              placeholder="Input Generic Name"
            />
          </n-form-item>
          <n-form-item label="Name" path="name">
            <n-input v-model:value="formValue.name" placeholder="Input Name" />
          </n-form-item>
          <n-form-item label="Category" path="category_id">
            <n-select
              clearable
              filterable
              :fallbackOption="false"

              v-model:value="formValue.category_id"
              :options="categories"
              placeholder="Select Unit ..."
            />
          </n-form-item>
          <n-form-item label="Unit" path="unit_id">
            <n-select
              clearable
              filterable
              :fallbackOption="false"
              v-model:value="formValue.unit_id"
              :options="units"
              placeholder="Select Unit ..."
            />
          </n-form-item>
          <n-form-item label="Type" path="type_id">
            <n-select
              clearable
              filterable
              :fallbackOption="false"

              v-model:value="formValue.type_id"
              :options="medicineTypes"
              placeholder="Select type ..."
            />
          </n-form-item>
          <n-form-item label="Description" path="description">
            <n-input
              v-model:value="formValue.description"
              placeholder="Input description ..."
            />
          </n-form-item>
          <n-form-item label="Price" path="price">
            <n-input-number
              class="w-full"
              clearable
              filterable
              v-model:value="formValue.price"
              :precision="0"
              :min="0"
              placeholder="Input price ..."
            />
          </n-form-item>
          <n-form-item label="Image" path="image">
            <n-upload
              :show-file-list="true"
              @update:file-list="handleChangeFile"
              v-model:default-file-list="fileList"
              list-type="image-card"
              :max="1"
              :on-success="handleImageUpload"
              :before-upload="beforeImageUpload"
            >
            </n-upload>
          </n-form-item>
          <div class="flex items-center justify-center">
            <n-button @click="handleSubmit"> Save</n-button>
          </div>
        </n-form>
      </div>
    </n-modal>

    <!-- Modal delete -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete
            <span class="font-semibold text-red-500">{{
              selectedMedicine?.name
            }}</span>
            ?
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
