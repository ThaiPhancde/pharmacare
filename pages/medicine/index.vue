<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { Eye, Pencil, Trash } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import BarcodeScanner from "@/components/BarcodeScanner.vue";
import BarcodeGenerator from "@/components/BarcodeGenerator.vue";
const { toast } = useToast();

const statuses = [
  { value: true, label: "🟢 Active" },
  { value: false, label: "🔴 Inactive" },
];

const showAdd = ref(false);
const showDelete = ref(false);
const showDetail = ref(false);
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

const showBarcodeScanner = ref(false);

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
  console.log('API response data:', res.data);
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
  { accessorKey: "bar_code", header: "Batch ID" },
  { accessorKey: "name", header: "Name" },
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
        h(Eye, {
          class:
            "w-4 h-4 text-green-600 cursor-pointer hover:scale-110 transition",
          onClick: () => handleViewDetail(item),
        }),
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

const handleViewDetail = (item) => {
  console.log('Medicine detail data:', item);
  selectedMedicine.value = item;
  showDetail.value = true;
};

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

const onBarcodeScanned = (decodedText) => {
  formValue.bar_code = decodedText;
  showBarcodeScanner.value = false;
};

const printBarcode = (barcode, name) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    message.error('Please allow pop-ups to print barcodes');
    return;
  }

  // Create content with separate strings to avoid template literal issues
  let content = '<!DOCTYPE html><html><head>';
  content += `<title>Print Barcode - ${name}</title>`;
  content += '<style>';
  content += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }';
  content += '.barcode-container { margin: 20px auto; max-width: 300px; }';
  content += '.item-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }';
  content += '.price { font-size: 12px; margin-top: 5px; }';
  content += '@media print { @page { size: 50mm 25mm; margin: 0; } body { width: 100%; height: 100%; padding: 5px; } }';
  content += '</style>';
  content += '</head><body>';
  content += '<div class="barcode-container">';
  content += `<div class="item-name">${name}</div>`;
  content += '<svg id="barcode"></svg>';
  content += `<div class="price">${formatVND(selectedMedicine.value.price)}</div>`;
  content += '</div>';
  content += '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>';
  content += '<script>';
  content += `JsBarcode("#barcode", "${barcode}", { format: "CODE128", width: 2, height: 50, displayValue: true, fontSize: 12 });`;
  content += 'window.onload = function() { setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 500); };';
  content += '<\/script>';
  content += '</body></html>';
  
  // Write to the new window
  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
};

const generateRandomBarcode = () => {
  // Generate EAN-13 format barcode
  // First 2-3 digits: country code (eg. 893 for Vietnam)
  // Next 4-5 digits: manufacturer code
  // Next 4-5 digits: product code
  // Last digit: check digit (we'll use 0 for simplicity)
  
  const countryCode = '893'; // Vietnam
  const manufacturerCode = Math.floor(10000 + Math.random() * 90000).toString();
  const productCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  // Combine them (we'll skip calculating the proper check digit for simplicity)
  const barcode = `${countryCode}${manufacturerCode}${productCode.substring(0, 4)}0`;
  
  formValue.bar_code = barcode;
  showBarcodeScanner.value = false;
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

    <!-- Medicine Detail Modal -->
    <n-modal v-model:show="showDetail" preset="card" style="width: 600px" title="Medicine Details">
      <div v-if="selectedMedicine" class="grid gap-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold mb-1">Batch ID:</h3>
            <p>{{ selectedMedicine.bar_code || '-' }}</p>
          </div>
          <div>
            <h3 class="font-semibold mb-1">Name:</h3>
            <p>{{ selectedMedicine.name || '-' }}</p>
          </div>
        </div>
        
        <!-- Barcode display -->
        <div v-if="selectedMedicine.bar_code" class="mt-2 p-3 border rounded-md">
          <h3 class="font-semibold mb-2">Barcode:</h3>
          <div class="flex flex-col items-center">
            <BarcodeGenerator 
              :value="selectedMedicine.bar_code" 
              :height="80"
              :width="2"
              :display-value="true"
              class="w-full max-w-xs mb-2"
            />
            <n-button size="small" @click="printBarcode(selectedMedicine.bar_code, selectedMedicine.name)">
              Print Barcode
            </n-button>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Generic Name:</h3>
          <p>{{ selectedMedicine.generic || '-' }}</p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Description:</h3>
          <p>{{ selectedMedicine.description || '-' }}</p>
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div>
            <h3 class="font-semibold mb-1">Category:</h3>
            <p>{{ selectedMedicine.category?.name || '-' }}</p>
          </div>
          <div>
            <h3 class="font-semibold mb-1">Type:</h3>
            <p>{{ selectedMedicine.type?.name || '-' }}</p>
          </div>
          <div>
            <h3 class="font-semibold mb-1">Unit:</h3>
            <p>{{ selectedMedicine.unit?.name || '-' }}</p>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-1">Price:</h3>
          <p>{{ formatVND(selectedMedicine.price) }}</p>
        </div>
        
        <div v-if="selectedMedicine.image">
          <h3 class="font-semibold mb-1">Image:</h3>
          <img :src="selectedMedicine.image" alt="Medicine Image" class="max-h-64 object-contain my-2" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <n-button @click="showDetail = false">Close</n-button>
        </div>
      </template>
    </n-modal>

    <!-- Modal add -->
    <n-modal v-model:show="showAdd" close-on-esc>
      <div class="bg-white min-w-600px p-4 rounded-xl">
        <n-form ref="formRef" :model="formValue">
          <n-form-item label="Bar Code/QR Code" path="bar_code">
            <div class="flex gap-2">
              <n-input
                v-model:value="formValue.bar_code"
                placeholder="Scan or enter barcode"
                class="flex-1"
              />
              <n-button @click="showBarcodeScanner = !showBarcodeScanner" size="small">
                {{ showBarcodeScanner ? 'Hide Scanner' : 'Scan Barcode' }}
              </n-button>
              <n-button 
                @click="generateRandomBarcode" 
                size="small" 
                type="info"
                v-if="!formValue.bar_code"
              >
                Generate
              </n-button>
            </div>
            
            <!-- Barcode scanner component -->
            <div v-if="showBarcodeScanner" class="mt-2">
              <BarcodeScanner @decode="onBarcodeScanned" title="Scan Product Barcode" />
            </div>
            
            <!-- Barcode preview -->
            <div v-if="formValue.bar_code" class="mt-3 p-3 border rounded bg-gray-50">
              <div class="text-xs text-gray-500 mb-1">Barcode Preview:</div>
              <BarcodeGenerator 
                :value="formValue.bar_code" 
                :height="60" 
                :width="1.5"
                class="w-full"
              />
            </div>
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
