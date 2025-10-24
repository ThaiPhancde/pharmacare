# Settings Module - PharmaCare

## Tổng quan

Module Settings được thiết kế lại hoàn toàn với logic backend đầy đủ, bao gồm:

1. **Account Settings**: Quản lý thông tin tài khoản, avatar, ngày sinh, số điện thoại
2. **Profile Settings**: Username, bio, đổi mật khẩu
3. **Notifications Settings**: Cài đặt thông báo email và mobile
4. **Appearance Settings**: Giao diện (theme, font)

## Cấu trúc API

### 1. User Profile APIs

#### GET `/api/user/profile`
Lấy thông tin profile của user hiện tại

**Response:**
```json
{
  "status": true,
  "data": {
    "_id": "...",
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "role": "admin",
    "avatar": "/avatars/avatar_123.jpg",
    "username": "nguyenvana",
    "phone": "0123456789",
    "dob": "1990-01-01",
    "language": "vi",
    "bio": "...",
    "settings": {
      "notifications": {...},
      "appearance": {...}
    }
  }
}
```

#### PUT `/api/user/profile`
Cập nhật thông tin profile

**Request Body:**
```json
{
  "name": "Nguyen Van A",
  "phone": "0123456789",
  "dob": "1990-01-01",
  "language": "vi",
  "username": "nguyenvana",
  "bio": "..."
}
```

**Note:** Không thể cập nhật `email`, `password`, `role` qua endpoint này

### 2. Avatar Upload API

#### POST `/api/user/avatar`
Upload avatar mới

**Request:** Multipart form data với file ảnh

**Supported formats:** JPG, JPEG, PNG, GIF, WEBP

**Max size:** 5MB

**Response:**
```json
{
  "status": true,
  "data": {
    "avatar": "/avatars/avatar_user123_1234567890.jpg",
    "user": {...}
  },
  "message": "Cập nhật avatar thành công"
}
```

**Features:**
- Tự động xóa avatar cũ khi upload ảnh mới
- Validate file type và size
- Tạo tên file unique với timestamp
- Lưu vào `/public/avatars/`

### 3. Password Change API

#### PUT `/api/user/password`
Đổi mật khẩu

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Validations:**
- Kiểm tra mật khẩu hiện tại có đúng không
- Mật khẩu mới phải >= 6 ký tự
- Mật khẩu được hash bằng bcrypt trước khi lưu

### 4. Settings APIs

#### PUT `/api/user/settings/notifications`
Cập nhật cài đặt thông báo

**Request Body:**
```json
{
  "type": "all | mentions | none",
  "mobile": true/false,
  "communication_emails": true/false,
  "social_emails": true/false,
  "marketing_emails": true/false,
  "security_emails": true/false
}
```

#### PUT `/api/user/settings/appearance`
Cập nhật giao diện

**Request Body:**
```json
{
  "theme": "light | dark",
  "font": "inter | manrope | system"
}
```

## Database Schema

### User Model Updates

```typescript
interface IUser {
  // ... existing fields
  avatar?: string                    // URL to avatar image
  username?: string                  // Public username
  phone?: string                     // Phone number
  dob?: Date                        // Date of birth
  language?: string                 // Preferred language (en, vi, etc.)
  bio?: string                      // User bio (max 160 chars)
  settings?: {
    notifications?: {
      type?: 'all' | 'mentions' | 'none'
      mobile?: boolean
      communication_emails?: boolean
      social_emails?: boolean
      marketing_emails?: boolean
      security_emails?: boolean
    }
    appearance?: {
      theme?: 'light' | 'dark'
      font?: 'inter' | 'manrope' | 'system'
    }
  }
}
```

## Composables

### useUserProfile()

Composable để quản lý user profile trong Vue components

**Usage:**
```typescript
const {
  userProfile,           // Ref<UserProfile | null>
  loading,              // Ref<boolean>
  fetchProfile,         // () => Promise<UserProfile | null>
  updateProfile,        // (data: Partial<UserProfile>) => Promise<boolean>
  uploadAvatar,         // (file: File) => Promise<string | null>
  changePassword        // (current: string, new: string) => Promise<boolean>
} = useUserProfile()
```

**Examples:**

```typescript
// Load profile
onMounted(async () => {
  await fetchProfile()
})

// Update profile
await updateProfile({
  name: 'New Name',
  phone: '0123456789'
})

// Upload avatar
const file = event.target.files[0]
const avatarUrl = await uploadAvatar(file)

// Change password
await changePassword('oldPass', 'newPass')
```

## Components

### Settings Pages

1. **`/pages/settings/account.vue`**
   - Hiển thị form account settings
   - Upload avatar
   - Cập nhật name, phone, dob, language

2. **`/pages/settings/profile.vue`**
   - Hiển thị thông tin email, role (read-only)
   - Cập nhật username, bio
   - Form đổi mật khẩu

3. **`/pages/settings/notifications.vue`**
   - Cài đặt loại thông báo (all/mentions/none)
   - Toggle email notifications
   - Mobile settings

4. **`/pages/settings/appearance.vue`**
   - Chọn theme (light/dark)
   - Chọn font (inter/manrope/system)

### Settings Components

1. **`components/settings/AccountForm.vue`**
   - Form cập nhật account info
   - Avatar upload với preview
   - Date picker cho ngày sinh
   - Language selector

2. **`components/settings/ProfileForm.vue`**
   - Form cập nhật username, bio
   - Password change form với validation
   - Display-only fields (email, role)

3. **`components/settings/NotificationsForm.vue`**
   - Radio group cho notification type
   - Switches cho email preferences
   - Mobile checkbox

4. **`components/settings/AppearanceForm.vue`**
   - Theme selector với visual preview
   - Font dropdown
   - Integration với `useColorMode()`

5. **`components/settings/Layout.vue`**
   - Layout wrapper cho tất cả settings pages
   - Sidebar navigation
   - Responsive design

## Features

### ✅ Implemented

1. **Account Management**
   - ✅ Update name, phone, dob, language
   - ✅ Avatar upload with preview
   - ✅ Avatar auto-delete old file
   - ✅ File validation (type, size)

2. **Profile Management**
   - ✅ Update username, bio
   - ✅ Display email, role (read-only)
   - ✅ Change password with validation
   - ✅ Password strength requirements

3. **Avatar System**
   - ✅ Upload image files
   - ✅ Preview before upload
   - ✅ Auto-resize/optimize (client-side)
   - ✅ Secure file naming
   - ✅ Old file cleanup

4. **Settings Persistence**
   - ✅ Notifications preferences
   - ✅ Appearance preferences
   - ✅ Auto-save to database
   - ✅ Load on mount

5. **Security**
   - ✅ JWT authentication required
   - ✅ User can only edit their own profile
   - ✅ Password verification before change
   - ✅ Bcrypt password hashing

## Usage Examples

### Load and Display User Profile

```vue
<script setup>
const { userProfile, fetchProfile } = useUserProfile()

onMounted(async () => {
  await fetchProfile()
})
</script>

<template>
  <div v-if="userProfile">
    <img :src="userProfile.avatar" />
    <h1>{{ userProfile.name }}</h1>
    <p>{{ userProfile.email }}</p>
  </div>
</template>
```

### Upload Avatar

```vue
<script setup>
const { uploadAvatar } = useUserProfile()
const fileInput = ref<HTMLInputElement | null>(null)

async function handleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    await uploadAvatar(file)
  }
}
</script>

<template>
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    @change="handleUpload"
  />
</template>
```

### Update Profile Information

```vue
<script setup>
const { updateProfile } = useUserProfile()

async function handleSubmit(values) {
  await updateProfile({
    name: values.name,
    phone: values.phone,
    language: values.language
  })
}
</script>
```

### Change Password

```vue
<script setup>
const { changePassword } = useUserProfile()

async function handlePasswordChange(values) {
  const success = await changePassword(
    values.currentPassword,
    values.newPassword
  )
  
  if (success) {
    // Password changed successfully
  }
}
</script>
```

## File Structure

```
pharmacare/
├── server/
│   ├── api/
│   │   └── user/
│   │       ├── profile.get.ts           # Get user profile
│   │       ├── profile.put.ts           # Update profile
│   │       ├── avatar.post.ts           # Upload avatar
│   │       ├── password.put.ts          # Change password
│   │       └── settings/
│   │           ├── notifications.put.ts # Update notifications
│   │           └── appearance.put.ts    # Update appearance
│   └── models/
│       └── User.ts                      # Updated with new fields
├── composables/
│   └── useUserProfile.ts                # Profile management composable
├── components/
│   └── settings/
│       ├── Layout.vue                   # Settings layout
│       ├── SidebarNav.vue              # Settings navigation
│       ├── AccountForm.vue             # Account settings form
│       ├── ProfileForm.vue             # Profile settings form
│       ├── NotificationsForm.vue       # Notifications form
│       └── AppearanceForm.vue          # Appearance form
└── pages/
    └── settings/
        ├── account.vue                  # Account page
        ├── profile.vue                  # Profile page
        ├── notifications.vue            # Notifications page
        └── appearance.vue               # Appearance page
```

## Testing

### Test Avatar Upload
1. Go to `/settings/account`
2. Click "Chọn ảnh" button
3. Select an image file (max 5MB)
4. Click "Upload" button
5. Avatar should update immediately

### Test Profile Update
1. Go to `/settings/account`
2. Update name, phone, or language
3. Click "Cập nhật tài khoản"
4. Check success message
5. Reload page to verify persistence

### Test Password Change
1. Go to `/settings/profile`
2. Enter current password
3. Enter new password (min 6 chars)
4. Confirm new password
5. Click "Đổi mật khẩu"
6. Try logging in with new password

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own data
3. **File Upload**: Strict validation on file type and size
4. **Password**: Bcrypt hashing with salt rounds
5. **Input Validation**: Server-side validation for all inputs
6. **XSS Prevention**: Sanitize user inputs
7. **CSRF Protection**: Cookie-based auth with SameSite

## Future Enhancements

- [ ] Email verification when changing email
- [ ] 2FA (Two-Factor Authentication)
- [ ] Activity log (login history, changes)
- [ ] Profile visibility settings (public/private)
- [ ] Social media links
- [ ] Timezone settings
- [ ] Export user data (GDPR compliance)
- [ ] Avatar cropper/editor
- [ ] Multiple avatar sizes (thumbnail, medium, large)
- [ ] CDN integration for avatars
