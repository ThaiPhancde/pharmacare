<script setup lang="ts">
const route = useRoute();

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
        <Avatar class="h-8 w-8 rounded-lg">
          <Icon name="i-lucide-bell" />
        </Avatar>
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
            <DropdownMenuItem @click="handleLogout">
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
