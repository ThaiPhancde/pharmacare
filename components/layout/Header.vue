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

// Interface for expiring medicine
interface ExpiringMedicine {
  _id: string;
  medicineName: string;
  batchId: string;
  daysLeft: number;
  expiryDate: string;
}

// Expiring medications data - only medicines expiring within 30 days (NOT expired)
const expiringMedications = ref<ExpiringMedicine[]>([]);
const loadingMedications = ref(false);

// Total expiring medications count
const totalExpiringMedications = computed(() => expiringMedications.value.length);

// Dialog open state
const isNotificationOpen = ref(false);

// Session key for login notification
const notificationShownKey = 'expiringMedicinesShown';

// Fetch expiring medicines from API
const fetchExpiringMedicines = async () => {
  loadingMedications.value = true;
  try {
    const data = await $fetch<{ status: boolean; data: ExpiringMedicine[] }>('/api/dashboard/expiring', {
      params: { days: 30, limit: 100 }
    });
    
    if (data?.status && data?.data) {
      // Only show medicines expiring soon (daysLeft > 0), NOT already expired
      expiringMedications.value = data.data.filter(item => item.daysLeft > 0 && item.daysLeft <= 30);
    }
  } catch (error) {
    console.error('Error fetching expiring medicines:', error);
  } finally {
    loadingMedications.value = false;
  }
};

// Show notification on first login
const checkAndShowNotification = () => {
  if (import.meta.client) {
    const shown = sessionStorage.getItem(notificationShownKey);
    if (!shown && expiringMedications.value.length > 0) {
      isNotificationOpen.value = true;
      sessionStorage.setItem(notificationShownKey, 'true');
    }
  }
};

function setLinks() {
  if (route.fullPath === "/") {
    return [{ title: "Home", href: "/" }];
  }

  const segments = route.fullPath.split("/").filter((item) => item !== "");

  // Xử lý đặc biệt cho trang chi tiết purchase
  if (segments.length >= 2 && segments[0] === "purchase" && segments[1] !== "add") {
    return [
      { title: "Home", href: "/" },
      { title: "Purchase", href: "/purchase" },
      { title: "Purchase Details", href: route.fullPath }
    ];
  }

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

const { userProfile, fetchProfile } = useUserProfile()

// Load data on mount
onMounted(async () => {
  fetchProfile();
  await fetchExpiringMedicines();
  // Show notification after data loads
  setTimeout(checkAndShowNotification, 500);
})

// Computed user data từ userProfile
const user = computed(() => ({
  name: userProfile.value?.name || 'Guest',
  email: userProfile.value?.email || 'guest@pharmacare.com',
  avatar: userProfile.value?.avatar || '/avatars/default-avatar.png'
}))

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
              <span v-if="totalExpiringMedications > 0" class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {{ totalExpiringMedications > 99 ? '99+' : totalExpiringMedications }}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[600px] w-full">
            <div class="flex justify-between items-center mb-2">
              <div>
                <DialogTitle class="text-orange-500 flex items-center gap-2 font-semibold">
                  <Icon name="i-lucide-alert-triangle" class="h-5 w-5" />
                  Expiring Medicines Alert
                </DialogTitle>
                <DialogDescription class="text-gray-600">
                  Medicines expiring within 30 days - Requires inventory action!
                </DialogDescription>
              </div>
            </div>
            
            <!-- Loading -->
            <div v-if="loadingMedications" class="flex justify-center py-8">
              <Icon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-orange-500" />
            </div>
            
            <!-- Empty -->
            <div v-else-if="expiringMedications.length === 0" class="text-center py-8">
              <Icon name="i-lucide-check-circle" class="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p class="text-green-600 font-medium">No medicines expiring soon!</p>
            </div>
            
            <!-- Table -->
            <div v-else class="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in expiringMedications" :key="item._id"
                            :class="{ 
                              'bg-red-50 dark:bg-red-950': item.daysLeft <= 7,
                              'bg-orange-50 dark:bg-orange-950': item.daysLeft > 7 && item.daysLeft <= 15,
                              'bg-yellow-50 dark:bg-yellow-950': item.daysLeft > 15
                            }">
                    <TableCell class="font-medium">{{ item.medicineName }}</TableCell>
                    <TableCell>{{ item.batchId }}</TableCell>
                    <TableCell>{{ new Date(item.expiryDate).toLocaleDateString() }}</TableCell>
                    <TableCell>
                      <Badge :class="{
                        'bg-red-500': item.daysLeft <= 7,
                        'bg-orange-500': item.daysLeft > 7 && item.daysLeft <= 15,
                        'bg-yellow-500 text-black': item.daysLeft > 15
                      }">
                        {{ item.daysLeft }} days left
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="flex justify-between items-center mt-4">
              <NuxtLink to="/stock/expiring" class="text-sm text-blue-500 hover:underline">
                View details →
              </NuxtLink>
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
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings/account">
                  <Icon name="i-lucide-badge-check" />
                  Account
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings">
                  <Icon name="i-lucide-settings" />
                  Settings
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings/notifications">
                  <Icon name="i-lucide-bell" />
                  Notifications
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <NuxtLink
                  to="https://github.com/ThaiPhancde/pharmacare"
                  external
                  target="_blank"
                >
                  <Icon name="i-lucide-github" />
                  Github Repository
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem>
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
