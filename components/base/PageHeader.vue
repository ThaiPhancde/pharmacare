<template>
  <div class="mb-6">
    <h1 class="text-2xl font-semibold text-foreground">{{ title }}</h1>
    <p v-if="subtitle" class="text-sm text-muted-foreground mt-1">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
});
</script> 