<script setup lang="ts">
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-vue-next";
import PasswordInput from "@/components/PasswordInput.vue";
import { toast } from "vue-sonner";
const form = ref({
  name: "",
  email: "",
  password: "",
  confirm_password: "",
});
const isLoading = ref(false);
async function onSubmit(event: Event) {
  event.preventDefault();
  if (form.value.password !== form.value.confirm_password) {
    return toast.error("Passwords do not match!");
  }

  isLoading.value = true;
  try {
    const { data, error } = await useFetch("/api/auth/register", {
      method: "POST",
      body: form.value,
    });

    if (error.value) throw error.value;

    toast.success("Registration successful!");
    navigateTo('/login')
  } catch (err: any) {
    toast.error(err.message || "Registration failed!");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div :class="cn('grid gap-6', $attrs.class ?? '')">
    <form @submit="onSubmit">
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="name"> Name </Label>
          <Input
            id="name"
            v-model="form.name"
            placeholder="Enter your name"
            type="text"
            auto-capitalize="none"
            auto-complete="name"
            auto-correct="off"
            :disabled="isLoading"
          />
        </div>
        <div class="grid gap-2">
          <Label for="email"> Email </Label>
          <Input
            id="email"
            v-model="form.email"
            placeholder="name@example.com"
            type="email"
            auto-capitalize="none"
            auto-complete="email"
            auto-correct="off"
            :disabled="isLoading"
          />
        </div>
        <div class="grid gap-2">
          <Label for="password"> Password </Label>
          <PasswordInput id="password" v-model="form.password" />
        </div>
        <div class="grid gap-2">
          <Label for="confirm-password"> Confirm Password </Label>
          <PasswordInput
            id="confirm-password"
            v-model="form.confirm_password"
          />
        </div>
        <Button :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Sign In with Email
        </Button>
      </div>
    </form>
  </div>
</template>
