<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import PasswordInput from "@/components/PasswordInput.vue";
import { useToast } from "@/components/ui/toast";
const email = ref("admin");
const password = ref("admin");
const isLoading = ref(false);

const cookie = useCookie("userAuth");
const { toast } = useToast();
const onSubmit = async (event: Event) => {
  event.preventDefault();
  if (!email.value || !password.value) return;

  isLoading.value = true;

  try {
    const response = await api.post<string>("/api/auth/login", {
      email: email.value,
      password: password.value,
    });

    if (response.data) {
      cookie.value = response.data;
      toast({
        title: "Login success",
      });
      navigateTo("/")
    }
  } catch (error) {
    toast({
      title: "Login failed. Try again later",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form class="grid gap-6" @submit="onSubmit">
    <div class="grid gap-2">
      <Label for="email"> Email </Label>
      <Input
        id="email"
        v-model="email"
        placeholder="name@example.com"
        :disabled="isLoading"
        auto-capitalize="none"
        auto-complete="email"
        auto-correct="off"
      />
    </div>
    <div class="grid gap-2">
      <div class="flex items-center">
        <Label for="password"> Password </Label>
        <NuxtLink
          to="/forgot-password"
          class="ml-auto inline-block text-sm underline"
        >
          Forgot your password?
        </NuxtLink>
      </div>
      <PasswordInput id="password" v-model="password" />
    </div>
    <Button type="submit" class="w-full" :disabled="isLoading">
      <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
      Login
    </Button>
  </form>
  <div class="mt-4 text-center text-sm text-muted-foreground">
    Don't have an account?
    <NuxtLink to="/register" class="underline"> Sign up </NuxtLink>
  </div>
</template>

<style scoped></style>
