<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { toTypedSchema } from '@vee-validate/zod'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { toDate } from 'radix-vue/date'
import { computed, onMounted, ref } from 'vue'
import * as z from 'zod'
import { useToast } from '@/components/ui/toast'

const { userProfile, fetchProfile, updateProfile, uploadAvatar } = useUserProfile()
const { toast } = useToast()

const open = ref(false)
const dateValue = ref()
const placeholder = ref()
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string>('')
const fileInputRef = ref<HTMLInputElement | null>(null)

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
  await fetchProfile()

  // Set giá trị ban đầu cho form
  if (userProfile.value) {
    if (userProfile.value.dob) {
      const date = new Date(userProfile.value.dob)
      dateValue.value = parseDate(date.toISOString().split('T')[0])
    }
  }
})

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
    dob: values.dob,
    language: values.language,
  })

  if (success) {
    toast({ title: 'Account updated successfully!' })
    await fetchProfile()
    
    // Button flash effect
    setTimeout(() => {
      isSubmitting.value = false
    }, 500)
  } else {
    isSubmitting.value = false
  }
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
    v-slot="{ setFieldValue }"
    :validation-schema="accountFormSchema"
    :initial-values="{
      name: userProfile.name,
      phone: userProfile.phone || '',
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
          <Input type="text" placeholder="Enter your phone number" v-bind="componentField" />
        </FormControl>
        <FormDescription>
          Your contact phone number.
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
      >
        Update Account
      </Button>
    </div>
  </Form>
</template>
