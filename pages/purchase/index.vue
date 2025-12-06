<script setup lang="ts">
import { computed, h, onMounted } from "vue";
import DataTable from "@/components/base/DataTable/index.vue";
import { Eye, Pencil, Trash } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();
const router = useRouter(); // Nuxt auto-import composable

const statuses = [
  { value: true, label: "🟢 Active" },
  { value: false, label: "🔴 Inactive" },
];

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  const res = await api.get("/api/purchase", {
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
  {
    accessorKey: "supplier",
    header: "Supplier",
    // dùng optional chaining để tránh lỗi khi supplier null
    cell: ({ row }) => row.original.supplier?.name ?? "-",
  },
  {
    accessorKey: "invoice_no",
    header: "Invoice No",
  },
  {
    accessorKey: "payment_type",
    header: "Payment",
    cell: ({ row }) =>
      row.original.payment_type
        ? row.original.payment_type.charAt(0).toUpperCase() +
        row.original.payment_type.slice(1)
        : "-",
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items ?? [];
      const names = items
        .map((item: any) => item.medicine?.name)
        .filter(Boolean)
        .join(", ");
      const truncated =
        names.length > 50 ? names.slice(0, 50).trim() + "..." : names;
      return h("span", { title: names }, truncated || "-");
    },
  },
  {
    accessorKey: "vat",
    header: "VAT (%)",
    cell: () => {
      return "10";
    },
  },
  {
    accessorKey: "total_price",
    header: "Total",
    cell: ({ row }) => {
      const total = row.original.total ?? 0;
      return total.toLocaleString("vi-VN") + "₫";
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
          onClick: () => navigateTo(`/purchase/${item._id}`),
        }),
        h(Pencil, {
          class:
            "w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition",
          onClick: () => navigateTo(`/purchase/edit/${item._id}`),
        }),
        h(Trash, {
          class:
            "w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition",
          onClick: () => confirmDelete(item),
        }),
      ]);
    },
  },
];

const confirmDelete = (item: any) => {
  if (
    confirm(`Are you sure you want to delete purchase ${item.invoice_no}?`)
  ) {
    deletePurchase(item._id);
  }
};

const deletePurchase = async (id: string) => {
  try {
    loading.value = true;

    const response = await fetch(`/api/purchase/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.status) {
      toast.success("Xóa đơn hàng thành công");
      await fetchData();
    } else {
      toast.error(result.message || "Xóa đơn hàng thất bại");
    }
  } catch (error) {
    toast.error("Xóa đơn hàng thất bại");
    console.error("Error deleting purchase:", error);
  } finally {
    loading.value = false;
  }
};

const handleAddClick = () => {
  router.push("/purchase/add");
};
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">List Purchase</h2>
      <Button @click="handleAddClick">Add</Button>
    </div>

    <DataTable :data="dataTable" :columns="columns" filterKey="invoice_no" v-model:page="pagination.page"
      @changePage="handlePageChange" v-model:size="pagination.limit" v-model:total="pagination.total" />
  </div>
</template>