<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '@/types/nav'
import { navMenu, navMenuBottom } from '@/constants/menus'

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

// Get user info from cookie
const userCookie = useCookie("userInfo");
const user = computed(() => {
  if (userCookie.value) {
    try {
      const userInfo = JSON.parse(userCookie.value as string);
      console.log('User info from cookie:', userInfo); // Debug log
      return {
        name: userInfo.name || 'User',
        email: userInfo.email || 'user@pharmacare.com',
        avatar: '/avatars/avatartion.png',
        role: userInfo.role || 'sales'
      };
    } catch (error) {
      console.error('Error parsing user cookie:', error); // Debug log
    }
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
  const userRole = user.value.role;
  console.log('User role for filtering:', userRole); // Debug log
  
  // Tạm thời trả về toàn bộ menu, không lọc theo vai trò
  return navMenu;
  
  /* Tạm thời comment logic phân quyền
  const filtered = navMenu.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Admin can see everything
      if (userRole === 'admin') return true;
      
      // Type guard for NavLink
      if ('link' in item) {
        // Warehouse can see stock and purchase
        if (userRole === 'warehouse') {
          const warehouseAllowed = ['/', '/suppliers', '/customers', '/medicine', '/stock', '/purchase', '/bank'];
          return warehouseAllowed.some(path => item.link === path || item.link.startsWith(path + '/'));
        }
        
        // Sales can see everything except admin pages
        if (userRole === 'sales') {
          const salesAllowed = ['/', '/suppliers', '/customers', '/medicine', '/invoice', '/returns', '/bank'];
          return salesAllowed.some(path => item.link === path || item.link.startsWith(path + '/'));
        }
      }
      
      // Type guard for NavGroup (has children)
      if ('children' in item) {
        if (userRole === 'warehouse') {
          const warehouseAllowed = ['/medicine', '/stock', '/bank'];
          return warehouseAllowed.some(path => 
            item.children?.some((child: any) => child.link?.startsWith(path))
          );
        }
        
        if (userRole === 'sales') {
          const salesAllowed = ['/medicine', '/invoice', '/bank'];
          return salesAllowed.some(path => 
            item.children?.some((child: any) => child.link?.startsWith(path))
          );
        }
      }
      
      return false;
    })
  }));
  
  console.log('Filtered navMenu:', filtered); // Debug log
  return filtered;
  */
});

// Filter bottom menu based on role
const filteredNavMenuBottom = computed(() => {
  // Tạm thời trả về toàn bộ menu dưới cùng, không lọc theo vai trò
  return navMenuBottom;
  
  /* Tạm thời comment logic phân quyền
  const userRole = user.value.role;
  return navMenuBottom.filter(item => {
    if ('link' in item && item.link.startsWith('/admin')) {
      return userRole === 'admin';
    }
    return true;
  });
  */
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
