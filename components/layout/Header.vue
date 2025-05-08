<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";

const route = useRoute();

// Demo data for expired medications
const expiredMedications = ref([
  { name: 'Paracetamol', batchId: '52678', expiryDate: '2024-12-31', daysLeft: -8, stock: 30 },
  { name: 'Vitamin C', batchId: '589', expiryDate: '2024-12-25', daysLeft: -14, stock: 45 },
  { name: 'Amoxicillin', batchId: '5665656', expiryDate: '2025-05-07', daysLeft: 1, stock: 40 },
  { name: 'Loratadine', batchId: '87909876', expiryDate: '2025-04-30', daysLeft: -8, stock: 70 },
  { name: 'Ibuprofen', batchId: 'Batch-2', expiryDate: '2025-05-01', daysLeft: -7, stock: 25 }
]);

// Total expired medications count
const totalExpiredMedications = computed(() => expiredMedications.value.length);

// Dialog open state
const isNotificationOpen = ref(false);

function setLinks() {
  if (route.fullPath === "/") {
    return [{ title: "Home", href: "/" }];
  }

  const segments = route.fullPath.split("/").filter((item) => item !== "");

  const breadcrumbs = segments.map((item, index) => {
    const str = item.replace(/-/g, " ");
    const title = str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return {
      title,
      href: `/${segments.slice(0, index + 1).join("/")}`,
    };
  });

  return [{ title: "Home", href: "/" }, ...breadcrumbs];
}

const links = ref<
  {
    title: string;
    href: string;
  }[]
>(setLinks());

const user: {
  name: string;
  email: string;
  avatar: string;
} = {
  name: "Dian Pratama",
  email: "dianpratama2@gmail.com",
  avatar: "/avatars/avatartion.png",
};
watch(
  () => route.fullPath,
  (val) => {
    if (val) {
      links.value = setLinks();
    }
  }
);
</script>

<template>
  <header
    class="sticky top-0 z-10 h-53px flex items-center gap-4 border-b bg-background px-4 md:px-6"
  >
    <div class="w-full flex justify-between items-center">
      <div class="flex items-center gap-4">
        <SidebarTrigger />
        <Separator orientation="vertical" class="h-4" />
        <BaseBreadcrumbCustom :links="links" />
      </div>
      <div class="flex items-center gap-2">
        <Dialog v-model:open="isNotificationOpen">
          <DialogTrigger as-child>
            <Button variant="ghost" size="icon" class="relative">
              <Icon name="i-lucide-bell" class="h-5 w-5" />
              <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {{ totalExpiredMedications }}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[600px] w-full">
            <div class="flex justify-between items-center mb-2">
              <div>
                <DialogTitle class="text-red-600 flex items-center gap-2 font-semibold">
                  <Icon name="i-lucide-alert-circle" class="h-5 w-5" />
                  Date Expired Medicine
                </DialogTitle>
                <DialogDescription class="text-gray-600">
                  Medications expiring within 30 days or already expired
                </DialogDescription>
              </div>
              <!-- Đã loại bỏ nút X trùng lặp ở đây -->
            </div>
            <div class="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Batch Id</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in expiredMedications" :key="item.batchId"
                            :class="{ 'bg-red-50 dark:bg-red-950': item.daysLeft <= 0 }">
                    <TableCell class="font-medium">{{ item.name }}</TableCell>
                    <TableCell>{{ item.batchId }}</TableCell>
                    <TableCell>{{ new Date(item.expiryDate).toLocaleDateString('vi-VN') }}</TableCell>
                    <TableCell>
                      <Badge :variant="item.daysLeft <= 0 ? 'destructive' : 'warning'">
                        {{ item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft} days left` }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ item.stock }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="flex justify-center mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="user.avatar" :alt="user.name" />
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
            :side="'bottom'"
            align="end"
          >
            <DropdownMenuLabel class="p-0 font-normal">
              <div
                class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
              >
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage :src="user.avatar" :alt="user.name" />
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ user.name }}</span>
                  <span class="truncate text-xs">{{ user.email }}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon name="i-lucide-sparkles" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon name="i-lucide-badge-check" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings" @click="setOpenMobile(false)">
                  <Icon name="i-lucide-settings" />
                  Settings
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon name="i-lucide-bell" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <NuxtLink
                  to="https://github.com/dianprata/nuxt-shadcn-dashboard"
                  external
                  target="_blank"
                >
                  <Icon name="i-lucide-github" />
                  Github Repository
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem @click="showModalTheme = true">
                <Icon name="i-lucide-paintbrush" />
                Theme
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout">
              <Icon name="i-lucide-log-out" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div class="ml-auto">
      <slot />
    </div>
  </header>
</template>

<style scoped></style>
