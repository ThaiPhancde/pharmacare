<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import * as z from 'zod'
import { useToast } from '@/components/ui/toast'

const { userProfile, fetchProfile, updateProfile, changePassword } = useUserProfile()
const { toast } = useToast()

const isSubmitting = ref(false)
const isChangingPassword = ref(false)

const profileFormSchema = toTypedSchema(z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  bio: z.string().max(160, { message: 'Bio must not be longer than 160 characters.' }).optional(),
}))

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: profileFormSchema,
})

onMounted(async () => {
  await fetchProfile()
  if (userProfile.value) {
    setValues({
      username: userProfile.value.username || '',
      bio: userProfile.value.bio || '',
    })
  }
})

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true
  
  const success = await updateProfile({
    username: values.username,
    bio: values.bio,
  })
  
  if (success) {
    toast({ title: 'Profile updated successfully!' })
    await fetchProfile()
    
    // Button flash effect
    setTimeout(() => {
      isSubmitting.value = false
    }, 500)
  } else {
    isSubmitting.value = false
  }
})

// Password change form
const passwordFormSchema = toTypedSchema(z.object({
  currentPassword: z.string().min(1, 'Please enter current password'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}))

async function onPasswordSubmit(values: any) {
  isChangingPassword.value = true
  
  const success = await changePassword(values.currentPassword, values.newPassword)
  
  if (success) {
    toast({ title: 'Password changed successfully!' })
    // Reset form
    values.currentPassword = ''
    values.newPassword = ''
    values.confirmPassword = ''
    
    // Button flash effect
    setTimeout(() => {
      isChangingPassword.value = false
    }, 500)
  } else {
    isChangingPassword.value = false
  }
}
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Hồ sơ
    </h3>
    <p class="text-sm text-muted-foreground">
      Thông tin cá nhân và mô tả về bạn.
    </p>
  </div>
  <Separator />

  <!-- Profile Info -->
  <form v-if="userProfile" class="space-y-6" @submit="onSubmit">
    <div class="space-y-4">
      <div class="grid gap-2">
        <div class="text-sm font-medium">
          Email
        </div>
        <div class="rounded-md border bg-muted px-3 py-2 text-sm">
          {{ userProfile.email }}
        </div>
        <p class="text-xs text-muted-foreground">
          Email không thể thay đổi.
        </p>
      </div>

      <div class="grid gap-2">
        <div class="text-sm font-medium">
          Vai trò
        </div>
        <div class="capitalize rounded-md border bg-muted px-3 py-2 text-sm">
          {{ userProfile.role === 'admin' ? 'Quản trị viên' : userProfile.role === 'warehouse' ? 'Kho' : 'Bán hàng' }}
        </div>
      </div>
    </div>

    <FormField v-slot="{ componentField }" name="username">
      <FormItem>
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Enter username" v-bind="componentField" />
        </FormControl>
        <FormDescription>
          Your public display username.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="bio">
      <FormItem>
        <FormLabel>Bio</FormLabel>
        <FormControl>
          <Textarea placeholder="Tell us a little bit about yourself..." v-bind="componentField" />
        </FormControl>
        <FormDescription>
          Brief description about yourself (max 160 characters).
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex justify-start gap-2">
      <Button 
        type="submit"
        :class="{ 'bg-green-600 hover:bg-green-600': isSubmitting }"
      >
        Update Profile
      </Button>

      <Button
        type="button"
        variant="outline"
        @click="resetForm"
      >
        Reset
      </Button>
    </div>
  </form>

  <Separator class="my-8" />

  <!-- Password Change Section -->
  <div>
    <h3 class="text-lg font-medium">
      Change Password
    </h3>
    <p class="text-sm text-muted-foreground">
      Update your login password.
    </p>
  </div>
  <Separator />

  <Form v-slot="{ values }" :validation-schema="passwordFormSchema" class="space-y-6" @submit="(vals: any) => onPasswordSubmit(vals)">
    <FormField v-slot="{ componentField }" name="currentPassword">
      <FormItem>
        <FormLabel>Current Password</FormLabel>
        <FormControl>
          <PasswordInput
            v-bind="componentField"
            placeholder="Enter current password"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="newPassword">
      <FormItem>
        <FormLabel>New Password</FormLabel>
        <FormControl>
          <PasswordInput
            v-bind="componentField"
            placeholder="Enter new password"
          />
        </FormControl>
        <FormDescription>
          Password must be at least 6 characters.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirmPassword">
      <FormItem>
        <FormLabel>Confirm Password</FormLabel>
        <FormControl>
          <PasswordInput
            v-bind="componentField"
            placeholder="Re-enter new password"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex justify-start">
      <Button 
        type="submit" 
        :disabled="!values.currentPassword || !values.newPassword || !values.confirmPassword"
        :class="{ 'bg-green-600 hover:bg-green-600': isChangingPassword }"
      >
        Change Password
      </Button>
    </div>
  </Form>
</template>
