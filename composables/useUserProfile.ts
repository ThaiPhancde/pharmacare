import type { IResponse } from '~/utils/api'

interface UserProfile {
  _id: string
  name: string
  email: string
  role: 'admin' | 'warehouse' | 'sales'
  isActive: boolean
  avatar?: string
  username?: string
  phone?: string
  dob?: string
  language?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export function useUserProfile() {
  const userProfile = useState<UserProfile | null>('userProfile', () => null)
  const loading = ref(false)
  const api = useApi()

  // Lấy thông tin profile
  async function fetchProfile() {
    loading.value = true
    try {
      const response = await api.get<UserProfile>('/api/user/profile')

      if (response.status) {
        userProfile.value = response.data
        return response.data
      }
      else {
        return null
      }
    }
    catch (error: any) {
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Cập nhật profile
  async function updateProfile(data: Partial<UserProfile>) {
    loading.value = true
    try {
      const response = await api.put<UserProfile>('/api/user/profile', data)

      if (response.status) {
        userProfile.value = response.data
        return true
      }
      else {
        return false
      }
    }
    catch (error: any) {
      return false
    }
    finally {
      loading.value = false
    }
  }

  // Upload avatar
  async function uploadAvatar(file: File) {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await $fetch<IResponse<{ avatar: string, user: UserProfile }>>('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.status) {
        if (userProfile.value) {
          userProfile.value.avatar = response.data.avatar
        }
        return response.data.avatar
      }
      else {
        return null
      }
    }
    catch (error: any) {
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Đổi mật khẩu
  async function changePassword(currentPassword: string, newPassword: string) {
    loading.value = true
    try {
      const response = await api.put<any>('/api/user/password', {
        currentPassword,
        newPassword,
      })

      if (response.status) {
        return true
      }
      else {
        return false
      }
    }
    catch (error: any) {
      return false
    }
    finally {
      loading.value = false
    }
  }

  return {
    userProfile,
    loading,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
