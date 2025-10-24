import jwt from 'jsonwebtoken'
import User from '@/server/models/User'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const cookies = parseCookies(event)
    const token = cookies.userAuth

    if (!token) {
      return {
        status: false,
        message: 'Authentication token not found',
      }
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret as string) as { id: string }

    // Đọc form data
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      return {
        status: false,
        message: 'No file uploaded',
      }
    }

    const fileData = form[0]

    // Kiểm tra file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!fileData.type || !allowedTypes.includes(fileData.type)) {
      return {
        status: false,
        message: 'Only image files are accepted (jpg, jpeg, png, gif, webp)',
      }
    }

    // Kiểm tra file size (max 5MB)
    if (fileData.data.length > 5 * 1024 * 1024) {
      return {
        status: false,
        message: 'File size must not exceed 5MB',
      }
    }

    // Tạo tên file unique
    const ext = fileData.filename?.split('.').pop() || 'jpg'
    const fileName = `avatar_${decoded.id}_${Date.now()}.${ext}`

    // Đảm bảo thư mục avatars tồn tại
    const uploadDir = path.join(process.cwd(), 'public', 'avatars')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Lưu file
    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, fileData.data)

    // Xóa avatar cũ nếu có
    const user = await User.findById(decoded.id)
    if (user?.avatar && user.avatar.startsWith('/avatars/')) {
      const oldFilePath = path.join(process.cwd(), 'public', user.avatar)
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }
    }

    // Cập nhật avatar trong database
    const avatarUrl = `/avatars/${fileName}`
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { avatar: avatarUrl } },
      { new: true },
    ).select('-password')

    return {
      status: true,
      data: {
        avatar: avatarUrl,
        user: updatedUser,
      },
      message: 'Avatar updated successfully',
    }
  }
  catch (error: any) {
    return {
      status: false,
      message: error.message,
    }
  }
})
