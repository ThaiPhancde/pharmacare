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

    // Lấy thông tin user
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return {
        status: false,
        message: 'User not found',
      }
    }

    return {
      status: true,
      data: user,
      message: 'Profile retrieved successfully',
    }
  }
  catch (error: any) {
    return {
      status: false,
      message: error.message,
    }
  }
})
