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
        message: 'Không tìm thấy token xác thực',
      }
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret as string) as { id: string }

    // Lấy dữ liệu từ body
    const body = await readBody(event)

    // Cập nhật settings
    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        $set: {
          'settings.appearance': body,
        },
      },
      { new: true, runValidators: true },
    ).select('-password')

    if (!user) {
      return {
        status: false,
        message: 'Không tìm thấy người dùng',
      }
    }

    return {
      status: true,
      data: user,
      message: 'Cập nhật giao diện thành công',
    }
  }
  catch (error: any) {
    return {
      status: false,
      message: error.message,
    }
  }
})
