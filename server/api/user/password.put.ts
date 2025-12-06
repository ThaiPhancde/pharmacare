import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '@/server/models/User'

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

    // Lấy dữ liệu từ body
    const body = await readBody(event)
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return {
        status: false,
        message: 'Please provide current password and new password',
      }
    }

    // Lấy user với password
    const user = await User.findById(decoded.id)

    if (!user) {
      return {
        status: false,
        message: 'User not found',
      }
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password)

    if (!isPasswordValid) {
      return {
        status: false,
        message: 'Current password is incorrect',
      }
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    // Cập nhật mật khẩu
    await User.findByIdAndUpdate(decoded.id, { $set: { password: hashedPassword } })

    return {
      status: true,
      message: 'Password changed successfully',
    }
  }
  catch (error: any) {
    return {
      status: false,
      message: error.message,
    }
  }
})
