<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Returns Management</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Manage customer returns and supplier returns
        </p>
      </div>
    </div>

    <n-tabs type="line" class="mt-4" @update:value="handleTabChange">
      <n-tab-pane name="customer" tab="Customer Returns">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-semibold">Customer Returns</h2>
            <p class="text-gray-500 dark:text-gray-400">
              Manage returns from customers
            </p>
          </div>
          
          <!-- Category filter buttons -->
          <div class="flex gap-2 items-center">
            <div class="flex gap-1 overflow-x-auto border rounded-md">
              <button 
                @click="navigateToAdd('customer')" 
                class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                New Customer Return
              </button>
            </div>
          </div>
        </div>
        
        <CustomerReturnsList />
      </n-tab-pane>
      
      <n-tab-pane name="supplier" tab="Supplier Returns">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-semibold">Supplier Returns</h2>
            <p class="text-gray-500 dark:text-gray-400">
              Manage returns to suppliers
            </p>
          </div>
          
          <!-- Category filter buttons -->
          <div class="flex gap-2 items-center">
            <div class="flex gap-1 overflow-x-auto border rounded-md">
              <button 
                @click="navigateToAdd('supplier')" 
                class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                New Supplier Return
              </button>
            </div>
          </div>
        </div>
        
        <SupplierReturnsList />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const activeTab = ref('customer');

// Handle tab change event
function handleTabChange(tabName: string) {
  activeTab.value = tabName;
}

// Navigate to the respective add page
function navigateToAdd(type: 'customer' | 'supplier') {
  console.log(`Navigating to ${type} add page`);
  router.push(`/returns/${type}/add`);
}

// Update the document title
useHead({
  title: 'Returns Management'
});
</script> 