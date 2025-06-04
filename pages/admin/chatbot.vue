<template>
  <div class="w-full p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">PharmaCare Chatbot Management</h1>
      <div class="flex space-x-2">
        <Button @click="importFromFile" :disabled="loading" variant="outline">
          <span v-if="loading" class="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a9 9 0 1 0 9 9"></path>
            </svg>
          </span>
          <span>Import from Medicine.txt</span>
        </Button>
        <Button @click="importDatabaseData" :disabled="isImporting" variant="outline">
          <span v-if="isImporting" class="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a9 9 0 1 0 9 9"></path>
            </svg>
          </span>
          <span>Import from Database</span>
        </Button>
        <Button @click="showAddModal = true" variant="default">
          Add New QA
        </Button>
      </div>
    </div>

    <!-- Status message for import statistics -->
    <div v-if="importStats" class="mb-6 p-4 bg-muted rounded-lg">
      <h3 class="text-lg font-medium mb-2">Import Statistics</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-background p-3 rounded-md border">
          <div class="text-sm text-muted-foreground">From Database</div>
          <div class="text-xl font-bold">{{ importStats.fromDb }}</div>
        </div>
        <div class="bg-background p-3 rounded-md border">
          <div class="text-sm text-muted-foreground">From Medicine.txt</div>
          <div class="text-xl font-bold">{{ importStats.fromText }}</div>
        </div>
        <div class="bg-background p-3 rounded-md border">
          <div class="text-sm text-muted-foreground">Total QA Pairs</div>
          <div class="text-xl font-bold">{{ importStats.total }}</div>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-card p-4 rounded-lg border shadow-sm">
        <h3 class="text-lg font-medium mb-1">Total QA Pairs</h3>
        <p class="text-2xl font-bold">{{ pagination.total }}</p>
      </div>
      <div class="bg-card p-4 rounded-lg border shadow-sm">
        <h3 class="text-lg font-medium mb-1">Categories</h3>
        <p class="text-2xl font-bold">{{ Object.keys(categoryCounts).length }}</p>
      </div>
      <div class="bg-card p-4 rounded-lg border shadow-sm">
        <h3 class="text-lg font-medium mb-1">Most Common Category</h3>
        <p class="text-2xl font-bold">{{ mostCommonCategory }}</p>
      </div>
      <div class="bg-card p-4 rounded-lg border shadow-sm">
        <h3 class="text-lg font-medium mb-1">Last Updated</h3>
        <p class="text-2xl font-bold">{{ lastUpdated || 'N/A' }}</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="flex mb-4">
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input 
          v-model="searchQuery" 
          class="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          placeholder="Search questions or answers" 
          type="search" 
          @keyup.enter="searchQA"
        />
      </div>
      <button @click="searchQA" class="ml-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
        Search
      </button>
      <button @click="clearSearch" class="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
        Clear
      </button>
    </div>

    <!-- Last Updated -->
    <p v-if="lastUpdated" class="mb-4 text-sm text-gray-500">Last updated: {{ lastUpdated }}</p>

    <!-- Data Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border border-gray-300 text-left">Question</th>
            <th class="p-2 border border-gray-300 text-left">Answer</th>
            <th class="p-2 border border-gray-300 text-left w-24">Category</th>
            <th class="p-2 border border-gray-300 text-left w-36">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="p-2 border border-gray-300 text-center">Loading...</td>
          </tr>
          <tr v-else-if="qaData.length === 0">
            <td colspan="4" class="p-2 border border-gray-300 text-center">No data available. Import or add data.</td>
          </tr>
          <tr v-for="(item, index) in qaData" :key="index" class="hover:bg-gray-50">
            <td class="p-2 border border-gray-300">{{ item.question }}</td>
            <td class="p-2 border border-gray-300">{{ item.answer }}</td>
            <td class="p-2 border border-gray-300">{{ item.category || 'general' }}</td>
            <td class="p-2 border border-gray-300">
              <div class="flex space-x-1">
                <button 
                  @click="editItem(item)" 
                  class="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  @click="deleteItem(item)" 
                  class="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <Dialog :open="showAddModal" @update:open="showAddModal = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ editingItem ? 'Edit QA Pair' : 'Add New QA Pair' }}</DialogTitle>
          <DialogDescription>
            {{ editingItem ? 'Update the existing question and answer' : 'Add a new question and answer to your database' }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="question" class="text-right">Question:</label>
            <textarea 
              id="question" 
              v-model="formData.question" 
              class="col-span-3 flex h-20 w-full rounded-md border border-input px-3 py-2"
            ></textarea>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="answer" class="text-right">Answer:</label>
            <textarea 
              id="answer"
              v-model="formData.answer" 
              class="col-span-3 flex h-40 w-full rounded-md border border-input px-3 py-2"
            ></textarea>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="category" class="text-right">Category:</label>
            <input 
              id="category"
              v-model="formData.category" 
              class="col-span-3 flex h-10 w-full rounded-md border border-input px-3 py-2"
              placeholder="E.g. general, dosage, side-effects"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="keywords" class="text-right">Keywords:</label>
            <input 
              id="keywords"
              v-model="formData.keywords" 
              class="col-span-3 flex h-10 w-full rounded-md border border-input px-3 py-2"
              placeholder="Space-separated keywords to improve search"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="medicineTerms" class="text-right">Medicine Terms:</label>
            <input 
              id="medicineTerms"
              v-model="formData.medicineTerms" 
              class="col-span-3 flex h-10 w-full rounded-md border border-input px-3 py-2"
              placeholder="Names of medicines relevant to this Q&A"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddModal = false">Cancel</Button>
          <Button :disabled="formLoading" @click="saveItem">
            <span v-if="formLoading" class="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3a9 9 0 1 0 9 9"></path>
              </svg>
            </span>
            {{ editingItem ? 'Update' : 'Add' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog :open="deletingItem !== null" @update:open="deletingItem = null">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this Q&A pair? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deletingItem = null">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Pagination -->
    <div class="mt-4 flex justify-between items-center border-t pt-4">
      <div class="text-sm text-gray-500">
        Showing {{ qaData.length }} of {{ pagination.total }} QA pairs
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-1">
          <span class="text-sm">Items per page:</span>
          <select
            v-model="pagination.limit"
            class="px-2 py-1 border rounded-md text-sm"
            @change="handlePageSizeChange(parseInt(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="30">30</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div class="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            @click="handlePageChange(1)"
            :disabled="pagination.page === 1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-left"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="handlePageChange(pagination.page - 1)"
            :disabled="pagination.page === 1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <span class="mx-2 text-sm">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            @click="handlePageChange(pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="handlePageChange(pagination.totalPages)"
            :disabled="pagination.page === pagination.totalPages"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// State
const qaData = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showAddModal = ref(false);
const editingItem = ref<any>(null);
const deletingItem = ref<any>(null);
const formLoading = ref(false);
const lastUpdated = ref<string | null>(null);
const statusMessage = ref<string>('');
const statusSuccess = ref<boolean>(true);

// Pagination state
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  get totalPages() {
    return Math.ceil(this.total / this.limit);
  }
});

// Form data for add/edit
const formData = ref({
  question: '',
  answer: '',
  category: '',
  keywords: '',
  medicineTerms: ''
});

// Import from database state
const isImporting = ref(false);
const importStats = ref<{ fromDb: number; fromText: number; total: number } | null>(null);

// Helper function to truncate text
const truncate = (text: string, length: number) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Compute filtered data based on search query
const filteredData = computed(() => {
  if (!searchQuery.value) return qaData.value;
  
  const query = searchQuery.value.toLowerCase();
  return qaData.value.filter(item => 
    item.question.toLowerCase().includes(query) || 
    item.answer.toLowerCase().includes(query) ||
    (item.category && item.category.toLowerCase().includes(query))
  );
});

// Compute category counts
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  qaData.value.forEach(item => {
    const category = item.category || 'uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });
  return counts;
});

// Compute most common category
const mostCommonCategory = computed(() => {
  const counts = categoryCounts.value;
  let maxCount = 0;
  let maxCategory = 'None';
  
  Object.entries(counts).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = category;
    }
  });
  
  return maxCategory;
});

// Fetch QA data with pagination
const fetchQAData = async () => {
  loading.value = true;
  try {
    const response = await fetch(`/api/chatbot/qa?page=${pagination.value.page}&limit=${pagination.value.limit}`);
    const result = await response.json();
    
    if (result.success) {
      qaData.value = result.data;
      pagination.value.total = result.total;
      lastUpdated.value = new Date().toLocaleString();
    } else {
      console.error('Failed to fetch data:', result.message);
    }
  } catch (error) {
    console.error('Error fetching chatbot data:', error);
  } finally {
    loading.value = false;
  }
};

// Search QA data
const searchQA = async () => {
  if (!searchQuery.value.trim()) {
    fetchQAData();
    return;
  }
  
  loading.value = true;
  try {
    const response = await fetch(`/api/chatbot/qa/search?q=${encodeURIComponent(searchQuery.value)}&page=${pagination.value.page}&limit=${pagination.value.limit}`);
    const result = await response.json();
    
    if (result.success) {
      qaData.value = result.data;
      pagination.value.total = result.total;
      pagination.value.page = result.page;
    } else {
      console.error('Search failed:', result.message);
    }
  } catch (error) {
    console.error('Error searching:', error);
  } finally {
    loading.value = false;
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  fetchQAData();
};

// Import data from Medicine.txt
const importFromFile = async () => {
  loading.value = true;
  statusMessage.value = '';
  statusSuccess.value = true;
  importStats.value = null;

  try {
    const response = await fetch('/api/chatbot/parse-medicine-data', {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      statusMessage.value = `Successfully imported ${result.count} QA pairs from Medicine.txt`;
      importStats.value = result.data;
      fetchQAData();
    } else {
      console.error('Failed to import data:', result.message);
      statusSuccess.value = false;
      statusMessage.value = result.message || 'Import failed';
    }
  } catch (error) {
    console.error('Error importing chatbot data:', error);
    statusSuccess.value = false;
    statusMessage.value = 'Error importing chatbot data';
  } finally {
    loading.value = false;
  }
};

// Edit QA pair
const editItem = (item: any) => {
  editingItem.value = item;
  formData.value = {
    question: item.question,
    answer: item.answer,
    category: item.category || '',
    keywords: item.keywords || '',
    medicineTerms: item.medicineTerms || ''
  };
  showAddModal.value = true;
};

// Delete QA pair
const deleteItem = (item: any) => {
  deletingItem.value = item;
};

// Confirm delete
const confirmDelete = async () => {
  if (!deletingItem.value) return;
  
  formLoading.value = true;
  try {
    const response = await fetch(`/api/chatbot/qa/${deletingItem.value._id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      qaData.value = qaData.value.filter(item => item._id !== deletingItem.value._id);
      statusSuccess.value = true;
      statusMessage.value = 'Item deleted successfully';
    } else {
      console.error('Failed to delete:', result.message);
      statusSuccess.value = false;
      statusMessage.value = result.message || 'Delete failed';
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    statusSuccess.value = false;
    statusMessage.value = 'Error deleting item';
  } finally {
    deletingItem.value = null;
    formLoading.value = false;
  }
};

// Save QA pair (add or update)
const saveItem = async () => {
  formLoading.value = true;
  
  try {
    let url = '/api/chatbot/qa';
    let method = 'POST';
    
    if (editingItem.value) {
      url = `/api/chatbot/qa/${editingItem.value._id}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (editingItem.value) {
        const index = qaData.value.findIndex(item => item._id === editingItem.value._id);
        if (index !== -1) {
          qaData.value[index] = result.data;
        }
      } else {
        qaData.value.unshift(result.data);
      }
      
      showAddModal.value = false;
      statusSuccess.value = true;
      statusMessage.value = editingItem.value ? 'Item updated successfully' : 'Item added successfully';
      editingItem.value = null;
      resetForm();
    } else {
      console.error('Failed to save QA pair:', result.message);
      statusSuccess.value = false;
      statusMessage.value = result.message || 'Save failed';
    }
  } catch (error) {
    console.error('Error saving QA pair:', error);
    statusSuccess.value = false;
    statusMessage.value = 'Error saving QA pair';
  } finally {
    formLoading.value = false;
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    question: '',
    answer: '',
    category: '',
    keywords: '',
    medicineTerms: ''
  };
};

// Function to import database data
const importDatabaseData = async () => {
  isImporting.value = true;
  statusMessage.value = 'Đang import dữ liệu từ database...';
  statusSuccess.value = true;
  importStats.value = null;

  try {
    const response = await fetch('/api/chatbot/import-database-data', {
      method: 'POST'
    });

    const result = await response.json();

    if (result.success) {
      statusMessage.value = result.message;
      statusSuccess.value = true;
      importStats.value = result.data;
      
      // Refresh the QA list
      fetchQAData();
    } else {
      statusMessage.value = `Lỗi: ${result.message}`;
      statusSuccess.value = false;
    }
  } catch (error: any) {
    statusMessage.value = `Lỗi: ${error.message || 'Không thể import dữ liệu'}`;
    statusSuccess.value = false;
  } finally {
    isImporting.value = false;
  }
};

// Handle page change
const handlePageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage;
    fetchQAData();
  }
};

// Handle page size change
const handlePageSizeChange = (newSize: number) => {
  pagination.value.limit = newSize;
  pagination.value.page = 1; // Reset to first page when changing page size
  fetchQAData();
};

// Fetch data on component mount
onMounted(fetchQAData);
</script> 