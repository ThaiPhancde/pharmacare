import jwt from 'jsonwebtoken'
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

    // Không cho phép cập nhật password và role qua endpoint này
    delete body.password
    delete body.role
    delete body.email // Email không được thay đổi

    // Cập nhật user
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: body },
      { new: true, runValidators: true },
    ).select('-password')

    if (!user) {
      return {
        status: false,
        message: 'User not found',
      }
    }

    return {
      status: true,
      data: user,
      message: 'Profile updated successfully',
    }
  }
  catch (error: any) {
    return {
      status: false,
      message: error.message,
    }
  }
})
