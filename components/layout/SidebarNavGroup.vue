<script setup lang="ts">
import type { SidebarMenuButtonVariants } from '~/components/ui/sidebar'
import type { NavGroup } from '~/types/nav'
import { useSidebar } from '~/components/ui/sidebar'

withDefaults(defineProps<{
  item: NavGroup
  size?: SidebarMenuButtonVariants['size']
}>(), {
  size: 'default',
})

const { setOpenMobile } = useSidebar()

const openCollapsible = ref(false)
</script>

<template>
  <SidebarMenu>
    <Collapsible
      :key="item.title"
      v-model:open="openCollapsible"
      as-child
      class="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger as-child>
          <SidebarMenuButton :tooltip="item.title" :size="size">
            <Icon :name="item.icon || ''" mode="svg" />
            <span>{{ item.title }}</span>
            <span v-if="item.new" class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline">
              New
            </span>
            <Icon name="i-lucide-chevron-right" class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent class="overflow-visible">
          <SidebarMenuSub>
            <SidebarMenuSubItem
              v-for="subItem in item.children"
              :key="subItem.title"
            >
              <SidebarMenuSubButton as-child>
                <NuxtLink :to="subItem.link" @click="setOpenMobile(false)" class="flex items-center gap-2 w-full">
                  <span class="flex-1 min-w-0 truncate">{{ subItem.title }}</span>
                  <span v-if="subItem.new" class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline shrink-0">
                    New
                  </span>
                </NuxtLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  </SidebarMenu>
</template>

<style scoped>

</style>
