<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '@/types/nav'
import { navMenu, navMenuBottom } from '@/constants/menus'
import { filterMenuItemsByRole, isRouteAllowed, normalizeRole } from '@/utils/auth'

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')

  return resolveComponent('LayoutSidebarNavLink')
}

const teams: {
  name: string
  logo: string
  plan: string
}[] = [
  {
    name: 'An Thai Pharmacy',
    logo: 'i-lucide:briefcase-medical',
    plan: 'Pharmacy',
  },
  // {
  //   name: 'Acme Corp.',
  //   logo: 'i-lucide-audio-waveform',
  //   plan: 'Startup',
  // },
  // {
  //   name: 'Evil Corp.',
  //   logo: 'i-lucide-command',
  //   plan: 'Free',
  // },
]

// Get user info from cookie (Nuxt useCookie auto-deserializes)
const userCookie = useCookie<{ name?: string; email?: string; role?: string } | null>("userInfo");
const user = computed(() => {
  const userInfo = userCookie.value;
  console.log('User info from cookie:', userInfo); // Debug log
  
  if (userInfo && typeof userInfo === 'object') {
    return {
      name: userInfo.name || 'User',
      email: userInfo.email || 'user@pharmacare.com',
      avatar: '/avatars/avatartion.png',
      role: userInfo.role || 'sales'
    };
  }
  return {
    name: 'Guest',
    email: 'guest@pharmacare.com',
    avatar: '/avatars/avatartion.png',
    role: 'guest'
  };
});

const { sidebar } = useAppSettings()

// Filter menu items based on user role
const filteredNavMenu = computed(() => {
  const role = normalizeRole(user.value.role);
  console.log('Filtering menu for role:', role); // Debug
  
  // Admin sees everything
  if (role === 'admin') return navMenu;

  const sections = navMenu
    .map(section => ({
      ...section,
      items: filterMenuItemsByRole(section.items, role),
    }))
    .filter(section => section.items && section.items.length > 0);

  console.log('Filtered sections:', sections); // Debug
  return sections;
});

// Filter bottom menu based on role
const filteredNavMenuBottom = computed(() => {
  const role = normalizeRole(user.value.role);
  if (role === 'admin') return navMenuBottom;
  
  return navMenuBottom.filter(item => {
    if ('link' in item && item.link) {
      return isRouteAllowed(role, item.link as string);
    }
    return false;
  });
});
</script>

<template>
  <Sidebar :collapsible="sidebar.collapsible" :side="sidebar.side" :variant="sidebar.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader :teams="teams" />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in filteredNavMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in nav.items" :key="index" :item="item" />
      </SidebarGroup>
      <SidebarGroup class="mt-auto">
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in filteredNavMenuBottom" :key="index" :item="item" size="sm" />
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>

</style>
