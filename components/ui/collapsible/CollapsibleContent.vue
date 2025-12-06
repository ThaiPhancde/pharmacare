<script setup lang="ts">
import type { CollapsibleContentProps } from 'radix-vue'
import { CollapsibleContent } from 'radix-vue'

const props = defineProps<CollapsibleContentProps>()
</script>

<template>
  <CollapsibleContent 
    v-bind="props" 
    class="overflow-visible transition-all data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
  >
    <div class="overflow-visible">
      <slot />
    </div>
  </CollapsibleContent>
</template>
