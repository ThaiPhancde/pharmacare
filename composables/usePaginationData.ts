import { ref, reactive } from 'vue'

export function usePaginationData<T>(fetcher: (params: { page: number; limit: number }) => Promise<T[] | undefined>) {
  const data = ref<T[]>([])
  const loading = ref(false)

  const pagination = reactive({
    page: 1,
    limit: 10,
    total: 0,
    get totalPages() {
      return Math.ceil(this.total / this.limit)
    },
  })

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await fetcher({ page: pagination.page, limit: pagination.limit })
      console.log("Fetched data:", res);
      
      if (Array.isArray(res)) {
        // Process each item to ensure all properties are properly formatted
        data.value = res.map((item, index) => {
          // Add stt (sequence number) property
          const processedItem = {
            ...item,
            stt: (pagination.page - 1) * pagination.limit + index + 1,
          };
          
          console.log("Processed item for display:", processedItem);
          return processedItem;
        });
      } else {
        console.error("Expected array response but got:", res);
        data.value = [];
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      data.value = [];
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