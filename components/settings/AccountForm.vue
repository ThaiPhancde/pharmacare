<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { toTypedSchema } from '@vee-validate/zod'
import { Check, ChevronsUpDown, Mail, Phone, MapPin, User, Shield, Calendar } from 'lucide-vue-next'
import { toDate } from 'radix-vue/date'
import { computed, onMounted, ref, watch } from 'vue'
import * as z from 'zod'
import { useToast } from '@/components/ui/toast'

const { userProfile, fetchProfile, updateProfile, uploadAvatar, loading, resetState, changePassword } = useUserProfile()
const { toast } = useToast()

const open = ref(false)
const dateValue = ref()
const placeholder = ref()
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string>('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isLoading = ref(true)
const formKey = ref(0) // Key để force re-render form

// Password change state
const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const isChangingPassword = ref(false)

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Indonesia', value: 'id' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const accountFormSchema = toTypedSchema(z.object({
  name: z
    .string({
      required_error: 'Please enter your name.',
    })
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(50, {
      message: 'Name must not be longer than 50 characters.',
    }),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  dob: z.string().datetime().optional(),
  language: z.string().min(1, 'Please select a language.'),
}))

// Lấy avatar hiện tại
const currentAvatar = computed(() => {
  if (avatarPreview.value)
    return avatarPreview.value
  if (userProfile.value?.avatar)
    return userProfile.value.avatar
  return '/avatars/default-avatar.png'
})

// Load profile khi component mount
onMounted(async () => {
  isLoading.value = true
  resetState() // Reset để force fetch lại
  await fetchProfile(true) // Force fetch
  
  // Set giá trị ban đầu cho form
  if (userProfile.value) {
    if (userProfile.value.dob) {
      const date = new Date(userProfile.value.dob)
      dateValue.value = parseDate(date.toISOString().split('T')[0])
    }
    formKey.value++ // Force re-render form với data mới
  }
  isLoading.value = false
})

// Watch userProfile để update form khi data thay đổi
watch(userProfile, (newVal) => {
  if (newVal?.dob) {
    const date = new Date(newVal.dob)
    dateValue.value = parseDate(date.toISOString().split('T')[0])
  }
}, { deep: true })

// Xử lý chọn file avatar
function handleAvatarSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' })
      return
    }

    // Kiểm tra file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must not exceed 5MB', variant: 'destructive' })
      return
    }

    avatarFile.value = file

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Upload avatar
async function handleUploadAvatar() {
  if (!avatarFile.value) {
    toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' })
    return
  }

  const result = await uploadAvatar(avatarFile.value)
  if (result) {
    toast({ title: 'Avatar updated successfully!' })
    avatarFile.value = null
    avatarPreview.value = ''
    await fetchProfile() // Refresh to sync with header
  }
}

const isSubmitting = ref(false)

async function onSubmit(values: any) {
  isSubmitting.value = true
  
  const success = await updateProfile({
    name: values.name,
    phone: values.phone,
    address: values.address,
    bio: values.bio,
    dob: values.dob,
    language: values.language,
  })

  if (success) {
    toast({ title: 'Account updated successfully!' })
    await fetchProfile(true)
    
    // Button flash effect
    setTimeout(() => {
      isSubmitting.value = false
    }, 500)
  } else {
    isSubmitting.value = false
  }
}

// Handle password change
async function handleChangePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
    return
  }
  
  isChangingPassword.value = true
  const success = await changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
  
  if (success) {
    toast({ title: 'Password changed successfully!' })
    showPasswordModal.value = false
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } else {
    toast({ title: 'Error', description: 'Failed to change password. Please check your current password.', variant: 'destructive' })
  }
  isChangingPassword.value = false
}

// Get role badge color
const getRoleBadgeColor = computed(() => {
  const role = userProfile.value?.role
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700 border-red-200'
    case 'warehouse': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'sales': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
})

// Format date
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Not set'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">
      Account
    </h3>
    <p class="text-sm text-muted-foreground">
      Update your account settings. Set your preferred language and personal information.
    </p>
  </div>
  <Separator />

  <!-- Loading State -->
  <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p class="text-muted-foreground">Loading your profile...</p>
  </div>

  <template v-else>
    <!-- Account Info Card -->
    <Card class="mb-6">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          <User class="h-4 w-4" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="flex items-center gap-2">
            <Mail class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Email:</span>
            <span class="font-medium">{{ userProfile?.email || 'Not set' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Shield class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Role:</span>
            <Badge :class="getRoleBadgeColor" variant="outline">
              {{ userProfile?.role?.toUpperCase() || 'N/A' }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Member since:</span>
            <span class="font-medium">{{ formatDate(userProfile?.createdAt || '') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full" :class="userProfile?.isActive ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-muted-foreground">Status:</span>
            <span class="font-medium" :class="userProfile?.isActive ? 'text-green-600' : 'text-red-600'">
              {{ userProfile?.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Avatar Section -->
    <div class="space-y-4">
      <div class="flex items-center gap-6">
        <Avatar class="h-24 w-24">
          <AvatarImage :src="currentAvatar" alt="Avatar" />
          <AvatarFallback>{{ userProfile?.name?.charAt(0) || 'U' }}</AvatarFallback>
        </Avatar>
        <div class="space-y-2">
          <div class="text-sm font-medium">
            Profile Picture
          </div>
          <div class="text-xs text-muted-foreground">
            JPG, PNG, GIF or WEBP. Max 5MB.
          </div>
          <div class="flex gap-2">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarSelect"
            >
            <Button
              type="button"
              size="sm"
              variant="outline"
              @click="fileInputRef?.click()"
            >
              Choose Image
            </Button>
            <Button
              v-if="avatarFile"
              type="button"
              size="sm"
              :disabled="loading"
              @click="handleUploadAvatar"
            >
              {{ loading ? 'Uploading...' : 'Upload' }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Separator />

    <Form
      v-if="userProfile"
      :key="formKey"
      v-slot="{ setFieldValue }"
      :validation-schema="accountFormSchema"
      :initial-values="{
        name: userProfile.name,
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        bio: userProfile.bio || '',
        language: userProfile.language || 'en',
        dob: userProfile.dob,
      }"
      class="space-y-8"
      @submit="onSubmit"
    >
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>Full Name</FormLabel>
          <FormControl>
            <Input type="text" placeholder="Enter your full name" v-bind="componentField" />
          </FormControl>
          <FormDescription>
            This is the name that will be displayed on your profile.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormLabel>Phone Number</FormLabel>
          <FormControl>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Enter your phone number" class="pl-10" v-bind="componentField" />
            </div>
          </FormControl>
          <FormDescription>
            Your contact phone number.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="address">
        <FormItem>
          <FormLabel>Address</FormLabel>
          <FormControl>
            <div class="relative">
              <MapPin class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea placeholder="Enter your address" class="pl-10 min-h-[80px]" v-bind="componentField" />
            </div>
          </FormControl>
          <FormDescription>
            Your home or work address.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="bio">
        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea placeholder="Tell us a little about yourself..." class="min-h-[100px]" v-bind="componentField" />
          </FormControl>
          <FormDescription>
            A brief description about yourself. Max 500 characters.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ field, value }" name="dob">
        <FormItem class="flex flex-col">
          <FormLabel>Date of Birth</FormLabel>
          <Popover>
            <PopoverTrigger as-child>
              <FormControl>
                <Button
                  variant="outline"
                  :class="cn(
                    'w-[240px] justify-start text-left font-normal',
                    !value && 'text-muted-foreground',
                  )"
                >
                  <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                  <span>{{ value ? df.format(toDate(dateValue, getLocalTimeZone())) : "Pick a date" }}</span>
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent class="p-0">
              <Calendar
                v-model:placeholder="placeholder"
                v-model="dateValue"
                calendar-label="Date of birth"
                initial-focus
                :min-value="new CalendarDate(1900, 1, 1)"
                :max-value="today(getLocalTimeZone())"
                @update:model-value="(v: any) => {
                  if (v) {
                    dateValue = v
                    setFieldValue('dob', toDate(v).toISOString())
                  }
                  else {
                    dateValue = undefined
                    setFieldValue('dob', undefined)
                  }
                }"
              />
            </PopoverContent>
          </Popover>
          <FormDescription>
            Your date of birth.
          </FormDescription>
          <FormMessage />
        </FormItem>
        <input type="hidden" v-bind="field">
      </FormField>

      <FormField v-slot="{ value }" name="language">
        <FormItem class="flex flex-col">
          <FormLabel>Language</FormLabel>

          <Popover v-model:open="open">
            <PopoverTrigger as-child>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  :aria-expanded="open"
                  :class="cn(
                    'w-[200px] justify-between',
                    !value && 'text-muted-foreground',
                  )"
                >
                  {{ value ? languages.find(
                    (language) => language.value === value,
                  )?.label : 'Select language...' }}

                  <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent class="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search language..." />
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      v-for="language in languages"
                      :key="language.value"
                      :value="language.label"
                      @select="() => {
                        setFieldValue('language', language.value)
                        open = false
                      }"
                    >
                      <Check
                        :class="cn(
                          'mr-2 h-4 w-4',
                          value === language.value ? 'opacity-100' : 'opacity-0',
                        )"
                      />
                      {{ language.label }}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <FormDescription>
            The language that will be used in the dashboard.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex justify-start gap-2">
        <Button 
          type="submit" 
          :class="{ 'bg-green-600 hover:bg-green-600': isSubmitting }"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Saving...' : 'Update Account' }}
        </Button>
      </div>
    </Form>

    <Separator class="my-6" />

    <!-- Security Section -->
    <div class="space-y-4">
      <h4 class="text-base font-medium flex items-center gap-2">
        <Shield class="h-4 w-4" />
        Security
      </h4>
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Password</p>
              <p class="text-sm text-muted-foreground">Change your account password</p>
            </div>
            <Button variant="outline" @click="showPasswordModal = true">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Password Change Modal -->
    <Dialog v-model:open="showPasswordModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new password.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              v-model="passwordForm.currentPassword"
              placeholder="Enter current password"
            />
          </div>
          <div class="space-y-2">
            <Label for="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              type="password" 
              v-model="passwordForm.newPassword"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div class="space-y-2">
            <Label for="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              v-model="passwordForm.confirmPassword"
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showPasswordModal = false">Cancel</Button>
          <Button @click="handleChangePassword" :disabled="isChangingPassword">
            {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>
</template>
