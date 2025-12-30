<script setup>
import DataTable from "@/components/base/DataTable/index.vue";
import { useToast } from "@/components/ui/toast";
import { User, UserCog, UserX, Shield, ShieldCheck, Package, UserPlus } from "lucide-vue-next";

const { toast } = useToast();
const roleFilter = ref("");
const showEditModal = ref(false);
const showAddModal = ref(false);
const editingUser = ref(null);
const addingUser = ref(false);

// New user form
const newUser = ref({
  name: "",
  email: "",
  password: "",
  role: "sales",
  isActive: true,
  phone: ""
});

// Reset new user form
const resetNewUserForm = () => {
  newUser.value = {
    name: "",
    email: "",
    password: "",
    role: "sales",
    isActive: true,
    phone: ""
  };
};

// Open add user modal
const openAddModal = () => {
  resetNewUserForm();
  showAddModal.value = true;
};

// Create new user
const createUser = async () => {
  // Validation
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    toast({
      title: "Lỗi",
      description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      variant: "destructive",
    });
    return;
  }

  if (newUser.value.password.length < 6) {
    toast({
      title: "Lỗi",
      description: "Mật khẩu phải có ít nhất 6 ký tự",
      variant: "destructive",
    });
    return;
  }

  addingUser.value = true;
  try {
    await api.post("/api/admin/users", newUser.value);
    toast({
      title: "Thành công",
      description: "Tạo người dùng mới thành công",
    });
    showAddModal.value = false;
    resetNewUserForm();
    fetchData();
  } catch (error) {
    toast({
      title: "Lỗi",
      description: error.message || "Không thể tạo người dùng",
      variant: "destructive",
    });
  } finally {
    addingUser.value = false;
  }
};

const roleOptions = [
  { label: "All Roles", value: "" },
  { label: "Admin", value: "admin" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Sales", value: "sales" },
];

const {
  data: responseData,
  loading,
  pagination,
  fetchData,
  handlePageChange,
} = usePaginationData(async ({ page, limit }) => {
  try {
    const res = await api.get("/api/admin/users", {
      params: { page, limit, role: roleFilter.value },
    });
    pagination.total = res.total ?? 0;
    return res.data;
  } catch (error) {
    toast({
      title: "Error",
      description: "Unable to load users data",
      variant: "destructive",
    });
    return [];
  }
});

// Watch for role filter changes
watch(roleFilter, () => {
  fetchData();
});

const dataTable = computed(() => {
  return responseData.value;
});

// Statistics
const stats = computed(() => {
  if (!responseData.value?.length)
    return { total: 0, admin: 0, warehouse: 0, sales: 0, active: 0 };

  const result = { total: 0, admin: 0, warehouse: 0, sales: 0, active: 0 };
  responseData.value.forEach((user) => {
    result.total++;
    if (user.isActive) result.active++;
    if (user.role === 'admin') result.admin++;
    else if (user.role === 'warehouse') result.warehouse++;
    else if (user.role === 'sales') result.sales++;
  });

  return result;
});

onMounted(fetchData);

// Role badge styling
const getRoleBadge = (role) => {
  const badges = {
    admin: { text: "Admin", color: "text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold" },
    warehouse: { text: "Warehouse", color: "text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs font-semibold" },
    sales: { text: "Sales", color: "text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold" },
  };
  return badges[role] || { text: role, color: "text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold" };
};

// Status badge
const getStatusBadge = (isActive) => {
  return isActive
    ? { text: "Active", color: "text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold" }
    : { text: "Inactive", color: "text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold" };
};

// Edit user
const editUser = (row) => {
  editingUser.value = { ...row.original };
  showEditModal.value = true;
};

// Update user
const updateUser = async () => {
  try {
    await api.put(`/api/admin/users/${editingUser.value._id}`, editingUser.value);
    toast({
      title: "Success",
      description: "User updated successfully",
    });
    showEditModal.value = false;
    fetchData();
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to update user",
      variant: "destructive",
    });
  }
};

// Delete user
const deleteUser = async (id) => {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    await api.delete(`/api/admin/users/${id}`);
    toast({
      title: "Success",
      description: "User deleted successfully",
    });
    fetchData();
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete user",
      variant: "destructive",
    });
  }
};

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => h("div", { class: "font-medium" }, row.original.name),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const badge = getRoleBadge(row.original.role);
      return h("span", { class: badge.color }, badge.text);
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const status = getStatusBadge(row.original.isActive);
      return h("span", { class: status.color }, status.text);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString()
        : "",
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return h("div", { class: "flex gap-2" }, [
        h(
          "button",
          {
            class: "text-blue-600 hover:text-blue-800",
            onClick: () => editUser(row),
          },
          "Edit"
        ),
        row.original.role !== 'admin' && h(
          "button",
          {
            class: "text-red-600 hover:text-red-800",
            onClick: () => deleteUser(row.original._id),
          },
          "Delete"
        ),
      ]);
    },
  },
];
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">User Management</h2>
        <p class="text-gray-500">Manage system users and their permissions</p>
      </div>

      <div class="flex items-center gap-3">
        <n-button type="primary" @click="openAddModal" class="!bg-green-600 hover:!bg-green-700">
          <UserPlus class="w-4 h-4 mr-2" />
          Add User
        </n-button>
        
        <div class="flex items-center gap-2 p-2 rounded-lg shadow-sm">
          <span class="text-sm font-medium">Filter by role:</span>
          <n-select v-model:value="roleFilter" :options="roleOptions" style="width: 150px" class="text-primary" />
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Users</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
          </div>
          <User class="h-6 w-6 text-blue-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Active Users</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
          </div>
          <UserCog class="h-6 w-6 text-green-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Admins</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.admin }}</p>
          </div>
          <ShieldCheck class="h-6 w-6 text-red-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Warehouse</p>
            <p class="text-2xl font-bold text-purple-600">{{ stats.warehouse }}</p>
          </div>
          <Package class="h-6 w-6 text-purple-500" />
        </div>
      </n-card>

      <n-card class="rounded-lg shadow-sm bg-card border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Sales</p>
            <p class="text-2xl font-bold text-orange-600">{{ stats.sales }}</p>
          </div>
          <UserX class="h-6 w-6 text-orange-500" />
        </div>
      </n-card>
    </div>

    <!-- Main Table -->
    <DataTable :data="dataTable" :columns="columns" filterKey="name" v-model:page="pagination.page"
      @changePage="handlePageChange" v-model:size="pagination.limit" v-model:total="pagination.total"
      row-class="hover:bg-gray-50 transition-colors" />

    <!-- Edit Modal -->
    <n-modal v-model:show="showEditModal" preset="dialog" title="Edit User">
      <div class="space-y-4" v-if="editingUser">
        <div>
          <n-form-item label="Name">
            <n-input v-model:value="editingUser.name" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Email">
            <n-input v-model:value="editingUser.email" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Role">
            <n-select v-model:value="editingUser.role" :options="[
              { label: 'Admin', value: 'admin' },
              { label: 'Warehouse', value: 'warehouse' },
              { label: 'Sales', value: 'sales' }
            ]" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Status">
            <n-switch v-model:value="editingUser.isActive" />
          </n-form-item>
        </div>
      </div>
      <template #action>
        <n-button @click="showEditModal = false">Cancel</n-button>
        <n-button type="primary" @click="updateUser"
          class="!bg-green-600 hover:!bg-green-700 text-white font-semibold">Update</n-button>
      </template>
    </n-modal>

    <!-- Add User Modal -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="Thêm User Mới">
      <div class="space-y-4">
        <div>
          <n-form-item label="Họ tên" required>
            <n-input v-model:value="newUser.name" placeholder="Nhập họ tên" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Email" required>
            <n-input v-model:value="newUser.email" placeholder="Nhập email" type="email" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Mật khẩu" required>
            <n-input v-model:value="newUser.password" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" type="password" show-password-on="click" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Số điện thoại">
            <n-input v-model:value="newUser.phone" placeholder="Nhập số điện thoại" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Vai trò" required>
            <n-select v-model:value="newUser.role" :options="[
              { label: 'Admin - Quản trị viên', value: 'admin' },
              { label: 'Warehouse - Kho', value: 'warehouse' },
              { label: 'Sales - Bán hàng', value: 'sales' }
            ]" />
          </n-form-item>
        </div>
        <div>
          <n-form-item label="Trạng thái">
            <n-switch v-model:value="newUser.isActive">
              <template #checked>Active</template>
              <template #unchecked>Inactive</template>
            </n-switch>
          </n-form-item>
        </div>
      </div>
      <template #action>
        <n-button @click="showAddModal = false" :disabled="addingUser">Hủy</n-button>
        <n-button type="primary" @click="createUser" :loading="addingUser"
          class="!bg-green-600 hover:!bg-green-700 text-white font-semibold">
          <UserPlus class="w-4 h-4 mr-2" v-if="!addingUser" />
          Tạo User
        </n-button>
      </template>
    </n-modal>
  </div>
</template>