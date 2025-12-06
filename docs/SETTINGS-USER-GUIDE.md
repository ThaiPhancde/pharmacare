# Hướng Dẫn Sử Dụng Module Settings

## Tính năng chính

Module Settings đã được thiết kế lại hoàn toàn với logic backend đầy đủ:

### 1. Account Settings (`/settings/account`)
- ✅ **Upload avatar**: Chọn và upload ảnh đại diện (JPG, PNG, GIF, WEBP - max 5MB)
- ✅ **Thông tin cá nhân**: Cập nhật tên, số điện thoại, ngày sinh
- ✅ **Ngôn ngữ**: Chọn ngôn ngữ hiển thị (Tiếng Việt, English, etc.)

### 2. Profile Settings (`/settings/profile`)
- ✅ **Username & Bio**: Cập nhật username công khai và giới thiệu bản thân
- ✅ **Đổi mật khẩu**: Form đổi mật khẩu với validation đầy đủ
- ✅ **Thông tin tài khoản**: Hiển thị email và vai trò (read-only)

### 3. Notifications Settings (`/settings/notifications`)
- ✅ **Loại thông báo**: Chọn nhận tất cả/chỉ mentions/không nhận
- ✅ **Email preferences**: Bật/tắt các loại email thông báo
- ✅ **Mobile settings**: Cài đặt riêng cho thiết bị di động

### 4. Appearance Settings (`/settings/appearance`)
- ✅ **Theme**: Chọn giao diện sáng/tối với preview
- ✅ **Font**: Chọn font chữ (Inter/Manrope/System)

## API Endpoints

### User Profile
```
GET    /api/user/profile        - Lấy thông tin user
PUT    /api/user/profile        - Cập nhật thông tin
POST   /api/user/avatar         - Upload avatar
PUT    /api/user/password       - Đổi mật khẩu
```

### User Settings
```
PUT    /api/user/settings/notifications  - Cập nhật thông báo
PUT    /api/user/settings/appearance     - Cập nhật giao diện
```

## Sử dụng trong Code

### Composable `useUserProfile()`

```typescript
import { useUserProfile } from '~/composables/useUserProfile'

const {
  userProfile,      // Ref chứa thông tin user
  loading,          // Trạng thái loading
  fetchProfile,     // Load thông tin user
  updateProfile,    // Cập nhật thông tin
  uploadAvatar,     // Upload avatar
  changePassword    // Đổi mật khẩu
} = useUserProfile()

// Load profile
await fetchProfile()

// Update profile
await updateProfile({ name: 'New Name', phone: '0123456789' })

// Upload avatar
const file = event.target.files[0]
await uploadAvatar(file)

// Change password
await changePassword('oldPassword', 'newPassword')
```

## Quy trình Upload Avatar

1. User click "Chọn ảnh"
2. Browser hiển thị file picker
3. User chọn file ảnh
4. Component validate file (type, size)
5. Hiển thị preview ảnh
6. User click "Upload"
7. File được gửi lên server (FormData)
8. Server validate lại file
9. Lưu file vào `/public/avatars/`
10. Xóa avatar cũ (nếu có)
11. Cập nhật URL trong database
12. Trả về URL mới cho client
13. UI cập nhật avatar mới

## Security Features

- ✅ **Authentication**: Tất cả endpoints yêu cầu JWT token
- ✅ **Authorization**: User chỉ được edit profile của mình
- ✅ **File Validation**: Kiểm tra type và size file
- ✅ **Password Hashing**: Bcrypt với salt
- ✅ **Input Sanitization**: Validate tất cả inputs

## Database Schema

User model đã được mở rộng với các fields:

```typescript
{
  avatar: String,           // URL avatar
  username: String,         // Username công khai
  phone: String,           // Số điện thoại
  dob: Date,              // Ngày sinh
  language: String,        // Ngôn ngữ (en, vi, etc.)
  bio: String,            // Giới thiệu (max 160 chars)
  settings: {
    notifications: {...}, // Cài đặt thông báo
    appearance: {...}     // Cài đặt giao diện
  }
}
```

## Testing Checklist

### Test Account Settings
- [ ] Upload avatar thành công
- [ ] Hiển thị preview trước khi upload
- [ ] Validate file type (reject .exe, .pdf, etc.)
- [ ] Validate file size (reject > 5MB)
- [ ] Cập nhật name, phone, dob
- [ ] Chọn ngôn ngữ
- [ ] Xem success message sau khi save
- [ ] Reload page vẫn giữ được thông tin

### Test Profile Settings
- [ ] Cập nhật username, bio
- [ ] Email và role hiển thị nhưng không edit được
- [ ] Đổi mật khẩu với mật khẩu đúng
- [ ] Reject khi mật khẩu hiện tại sai
- [ ] Validate mật khẩu mới (min 6 chars)
- [ ] Validate confirm password match
- [ ] Logout và login lại với mật khẩu mới

### Test Notifications Settings
- [ ] Chọn notification type (all/mentions/none)
- [ ] Toggle email preferences
- [ ] Settings được lưu vào database
- [ ] Reload page vẫn giữ settings

### Test Appearance Settings
- [ ] Chọn theme (light/dark)
- [ ] Theme apply ngay lập tức
- [ ] Chọn font
- [ ] Settings được lưu vào database
- [ ] Reload page vẫn giữ theme và font

## Troubleshooting

### Avatar không upload được
- Kiểm tra file type (phải là image/*)
- Kiểm tra file size (max 5MB)
- Kiểm tra thư mục `/public/avatars/` tồn tại
- Kiểm tra permissions của thư mục

### Đổi mật khẩu không được
- Kiểm tra mật khẩu hiện tại có đúng không
- Mật khẩu mới phải >= 6 ký tự
- Confirm password phải match với new password

### Settings không được lưu
- Kiểm tra JWT token còn hợp lệ
- Kiểm tra connection tới MongoDB
- Check console log và network tab

## Tài liệu chi tiết

Xem file `/docs/SETTINGS-MODULE.md` để biết thêm chi tiết về:
- API documentation đầy đủ
- Database schema chi tiết
- Component architecture
- Code examples
- Security considerations
