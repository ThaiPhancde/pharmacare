import { ref, reactive } from 'vue'

export function usePaginationData<T>(fetcher: (params: { page: number; limit: number }) => Promise<T[] | undefined>) {
  const data = ref<T[]>([])
  const loading = ref(false)

  const pagination = reactive({
    page: 1,
    limit: 5,
    total: 0,
    get totalPages() {
      return Math.ceil(this.total / this.limit)
    },
  })

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await fetcher({ page: pagination.page, limit: pagination.limit })
      if (Array.isArray(res)) {
        data.value = res.map((item, index) => ({
          ...item,
          stt: (pagination.page - 1) * pagination.limit + index + 1,
        }))
      }
    } finally {
      loading.value = false
    }
  }

  const handlePageChange = (newPage: number, newSize: number) => {
    pagination.page = newPage
    pagination.limit = newSize
    fetchData()
  }

  return {
    data,
    loading,
    pagination,
    fetchData,
    handlePageChange,
  }
}