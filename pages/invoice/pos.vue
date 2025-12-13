<template>
  <div class="flex flex-col md:flex-row h-screen gap-4 p-4 overflow-hidden">
    <!-- Left section - Product selection -->
    <div class="w-full md:w-2/3 flex flex-col gap-4">
      <!-- Barcode scanner -->
      <n-card size="small">
        <BarcodeScanner @decode="onBarcodeScanned" title="Scan Product Barcode" />
      </n-card>

      <!-- Search and category filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative">
          <n-input type="text" placeholder="Search medicines..." v-model:value="searchQuery" />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2">
          <n-button v-for="category in categories" :key="category.id"
            :type="activeCategory === category.id ? 'primary' : 'default'" @click="setActiveCategory(category.id)"
            class="whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200"
            :class="{ 'bg-blue-600 text-white hover:bg-blue-700': activeCategory === category.id }">
            {{ category.name }}
          </n-button>
        </div>
      </div>

      <!-- Medicine grid -->
      <n-card class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center items-center h-full">
          <n-spin size="large" />
        </div>
        <div v-else-if="filteredMedicines.length === 0" class="flex justify-center items-center h-full text-gray-500">
          No medicines found
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <n-card v-for="medicine in filteredMedicines" :key="medicine._id"
            class="cursor-pointer hover:border-primary transition-colors" @click="addToCart(medicine)" size="small">
            <div class="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
              <img :src="medicine.image || '/medicine-placeholder.png'" :alt="medicine.name"
                class="object-cover w-full h-full" />
            </div>
            <div class="flex items-start justify-between gap-1 mb-1">
              <h3 class="font-medium text-sm leading-tight truncate flex-1">{{ medicine.name }}</h3>
              <n-tag v-if="medicine.prescription_required" type="warning" size="small" class="shrink-0">
                Rx
              </n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">{{ medicine.category?.name || 'N/A' }}</span>
              <span class="text-xs font-semibold">{{ formatCurrency(getMedicineDisplayPrice(medicine)) }}</span>
            </div>
            <!-- Add stock quantity information -->
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">Stock:</span>
              <span class="text-xs font-medium"
                :class="{ 'text-green-600': getMedicineAvailableStock(medicine) > 10, 'text-amber-600': getMedicineAvailableStock(medicine) > 0 && getMedicineAvailableStock(medicine) <= 10, 'text-red-600': getMedicineAvailableStock(medicine) === 0 }">
                {{ getMedicineAvailableStock(medicine) }}
              </span>
            </div>
            <!-- Show daily limit if exists -->
            <div v-if="medicine.max_quantity_per_day" class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">Daily Limit:</span>
              <span class="text-xs font-medium text-orange-600">
                {{ medicine.max_quantity_per_day }}
              </span>
            </div>
            <!-- Show monthly limit if exists -->
            <div v-if="medicine.max_quantity_per_month" class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">Monthly Limit:</span>
              <span class="text-xs font-medium text-purple-600">
                {{ medicine.max_quantity_per_month }}
              </span>
            </div>
          </n-card>
        </div>
      </n-card>
    </div>

    <!-- Right section - Cart and checkout -->
    <div class="w-full md:w-1/3 flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden">
      <!-- Shift Management -->
      <n-card size="small" class="flex-shrink-0 shadow-sm border-l-4"
        :class="activeShift ? 'border-green-500' : 'border-amber-500'">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold text-gray-800">Shift</h3>
          <n-tag :type="activeShift ? 'success' : 'warning'" size="small">
            {{ activeShift ? 'Active' : 'No Shift' }}
          </n-tag>
        </div>

        <div v-if="activeShift" class="space-y-2">
          <div class="text-sm">
            <span class="text-gray-600">Employee:</span>
            <span class="font-medium ml-2">{{ activeShift.employee?.full_name || activeShift.employee?.name || 'N/A'
            }}</span>
          </div>
          <div class="text-sm">
            <span class="text-gray-600">Type:</span>
            <span class="font-medium ml-2">{{ getShiftTypeLabel(activeShift.shift_type) }}</span>
          </div>
          <div class="text-sm">
            <span class="text-gray-600">Time:</span>
            <span class="font-medium ml-2">{{ activeShift.start_time }} - {{ activeShift.end_time }}</span>
          </div>
          <div v-if="activeShift.opening_balance !== undefined" class="text-sm">
            <span class="text-gray-600">Opening Balance:</span>
            <span class="font-medium ml-2">{{ formatCurrency(activeShift.opening_balance) }}</span>
          </div>
          <n-button size="small" type="error" class="!bg-red-600 hover:!bg-red-700 text-white font-semibold w-full mt-2"
            @click="handleEndShift" :loading="endingShift">
            End Shift
          </n-button>
        </div>

        <div v-else class="space-y-2">
          <n-select v-model:value="selectedShiftId" :options="availableShifts" placeholder="Select shift to start"
            filterable clearable class="w-full" @update:value="handleShiftSelect" />
          <n-button v-if="selectedShiftId" size="small" type="primary"
            class="!bg-green-600 hover:!bg-green-700 text-white font-semibold w-full" @click="handleStartShift"
            :loading="startingShift">
            Start Shift
          </n-button>
          <div v-else class="text-xs text-gray-500 text-center">
            No available shifts. Create one in Shift Management.
          </div>
        </div>
      </n-card>

      <!-- Customer selection -->
      <n-card size="small" class="flex-shrink-0 shadow-sm">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold text-gray-800">Customer</h3>
          <n-button size="small" quaternary @click="customerMode = customerMode === 'select' ? 'new' : 'select'"
            class="text-blue-600 hover:text-blue-700">
            {{ customerMode === 'select' ? 'New Customer' : 'Select Existing' }}
          </n-button>
        </div>

        <!-- Select existing customer -->
        <div v-if="customerMode === 'select'">
          <n-select v-model:value="selectedCustomer" :options="customers" placeholder="Select customer or leave empty"
            clearable filterable @update:value="handleCustomerSelect" class="w-full" />
        </div>

        <!-- Enter new customer info - Compact layout -->
        <div v-else class="space-y-3">
          <n-input v-model:value="newCustomerInfo.full_name" placeholder="Customer Name *" clearable size="small"
            class="w-full" />
          <div class="grid grid-cols-2 gap-2">
            <n-input v-model:value="newCustomerInfo.phone" placeholder="Phone" clearable size="small" />
            <n-input v-model:value="newCustomerInfo.email" placeholder="Email" clearable size="small" />
          </div>
          <n-input v-model:value="newCustomerInfo.address" placeholder="Address" clearable size="small"
            class="w-full" />
          <n-button size="small" quaternary @click="clearNewCustomer" class="w-full text-gray-600 hover:text-gray-700">
            Clear Information
          </n-button>
        </div>
      </n-card>

      <!-- Cart items -->
      <n-card title="Cart" size="small" class="flex-shrink-0 min-h-[300px] max-h-[400px] flex flex-col shadow-sm">
        <div class="flex-1 overflow-y-auto min-h-[250px] pr-1">
          <div v-if="cart.length === 0" class="flex justify-center items-center h-22 text-gray-500">
            <div class="text-center">
              <div class="text-4xl mb-2">🛒</div>
              <div>Cart is empty</div>
            </div>
          </div>
          <div v-else class="space-y-4">
            <div v-for="(item, index) in cart" :key="index"
              class="flex flex-col border-b border-gray-200 pb-3 last:border-b-0">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm mb-1 text-gray-800">{{ item.name }}</div>
                  <div class="text-xs text-gray-600 mb-1">
                    <span v-if="item.price && item.price > 0">
                      {{ formatCurrency(item.price) }} ×
                    </span>
                    <span v-else class="text-red-500">
                      Price: N/A ×
                    </span>
                    <n-input-number v-model:value="item.quantity" size="small" :min="1" :max="item.max_quantity"
                      @update:value="updateCartTotal" class="inline-block w-20 mx-1" />
                  </div>
                  <div class="flex flex-wrap gap-2 items-center text-xs">
                    <span class="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Stock: {{ item.max_quantity }}
                    </span>
                    <!-- Display discount information if applicable -->
                    <span v-if="item.discount_percentage > 0" class="text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {{ item.discount_percentage }}% off
                      <span v-if="item.original_price && item.original_price > 0"
                        class="line-through text-gray-500 ml-1">
                        {{ formatCurrency(item.original_price) }}
                      </span>
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span v-if="item.price && item.quantity"
                    class="font-bold text-base text-gray-800 min-w-[100px] text-right">
                    {{ formatCurrency(item.price * item.quantity) }}
                  </span>
                  <span v-else class="font-semibold text-red-500 min-w-[100px] text-right">
                    N/A
                  </span>
                  <n-button quaternary circle size="small" @click="removeItem(index)" class="hover:bg-red-50">
                    <template #icon>
                      <Trash class="h-4 w-4 text-red-500" />
                    </template>
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Checkout summary -->
      <n-card size="small" class="space-y-4 shadow-sm flex-shrink-0">
        <div class="space-y-3">
          <div class="flex justify-between items-center py-1">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-gray-600">VAT</span>
            <span class="font-medium">{{ formatCurrency(vatTotal) }}</span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-gray-600">Discount</span>
            <div class="flex items-center gap-2">
              <n-input-number v-model:value="discount" class="w-24" size="small" :min="0" :max="subtotal + vatTotal"
                :disabled="!!appliedVoucher" />
              <span class="font-medium min-w-[80px] text-right">{{ formatCurrency(discount) }}</span>
            </div>
          </div>
        </div>

        <n-divider class="my-2" />

        <div class="space-y-3">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Voucher Code</label>
            <div class="flex flex-wrap gap-2">
              <n-input v-model:value="voucherCode" placeholder="Enter voucher code" size="small"
                class="flex-1 min-w-[150px]" :disabled="voucherApplying" />
              <n-button size="small" type="primary" class="bg-blue-600 hover:bg-blue-700 text-white"
                :loading="voucherApplying" :disabled="!canApplyVoucher" @click="applyVoucherCode">
                Apply
              </n-button>
              <n-button v-if="appliedVoucher" size="small" type="default"
                class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700" @click="removeVoucher">
                Remove
              </n-button>
            </div>
          </div>
          <n-alert v-if="appliedVoucher" type="success" :closable="false" class="mt-2">
            Applied {{ appliedVoucher.voucher_code }} – saved {{ formatCurrency(appliedVoucher.discount_amount) }}.
            <span v-if="voucherNeedsRefresh" class="block text-amber-600 mt-1">
              Cart updated. Please re-apply to keep this discount.
            </span>
          </n-alert>
          <n-alert v-else-if="voucherMessage" type="default" :closable="false" class="mt-2">
            {{ voucherMessage }}
          </n-alert>
        </div>

        <n-divider class="my-2" />

        <div class="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-3">
          <span class="text-lg font-bold text-gray-800">Total</span>
          <span class="text-lg font-bold text-blue-600">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </n-card>

      <!-- Payment options -->
      <n-card size="small" class="space-y-4 shadow-sm flex-shrink-0">
        <div class="space-y-3">
          <div class="flex justify-between items-center py-1">
            <span class="text-gray-700 font-medium">Payment Method</span>
            <n-select v-model:value="paymentMethod" class="w-40" size="small" :options="[
              { label: 'Cash', value: 'cash' },
              { label: 'Card', value: 'card' },
              { label: 'Bank Transfer', value: 'bank' },
              { label: 'MoMo', value: 'momo' }
            ]" />
          </div>

          <!-- Cash payment -->
          <template v-if="paymentMethod === 'cash'">
            <div class="flex justify-between items-center py-1">
              <span class="text-gray-700 font-medium">Amount Paid</span>
              <n-input-number v-model:value="amountPaid" class="w-40" size="small" :min="0"
                :formatter="value => `${value?.toLocaleString('vi-VN') || 0} ₫`" />
            </div>
            <div v-if="change > 0" class="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
              <span class="font-semibold text-green-700">Change</span>
              <span class="font-bold text-green-600">{{ formatCurrency(change) }}</span>
            </div>
          </template>

          <!-- Card payment -->
          <template v-else-if="paymentMethod === 'card'">
            <div class="border border-gray-200 rounded p-4 bg-gray-50">
              <p class="text-sm text-center text-gray-500 mb-2">Please provide card information</p>
              <div class="flex flex-col gap-2">
                <div class="flex items-center">
                  <span class="w-24 text-xs">Card Holder</span>
                  <n-input v-model:value="cardInfo.name" size="small" placeholder="Enter cardholder name" />
                </div>
                <div class="flex items-center">
                  <span class="w-24 text-xs">Card Number</span>
                  <n-select v-model:value="cardInfo.number" size="small" placeholder="Select test card"
                    :options="testCardOptions" />
                </div>
                <div class="flex items-center">
                  <span class="w-24 text-xs">Expiry Date</span>
                  <div class="flex gap-1">
                    <n-select v-model:value="cardInfo.expMonth" size="small" placeholder="MM" class="w-16"
                      :options="monthOptions" />
                    <span>/</span>
                    <n-select v-model:value="cardInfo.expYear" size="small" placeholder="YY" class="w-16"
                      :options="yearOptions" />
                  </div>
                </div>
                <div class="flex items-center">
                  <span class="w-24 text-xs">CVV</span>
                  <n-input v-model:value="cardInfo.cvv" size="small" placeholder="XXX" class="w-16" />
                </div>
              </div>
              <div class="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-600">
                Test cards are provided by PayPal Sandbox. Select any card to test payment.
              </div>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span>Full Payment</span>
              <span class="font-bold">{{ formatCurrency(grandTotal) }}</span>
            </div>
            <n-button type="primary" class="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              :disabled="!cardInfo.name || !cardInfo.number || !cardInfo.expMonth || !cardInfo.expYear || !cardInfo.cvv"
              @click="processCardPayment">
              Pay
            </n-button>
          </template>

          <!-- Bank transfer -->
          <template v-else-if="paymentMethod === 'bank'">
            <div class="border border-gray-200 rounded p-4 bg-gray-50 flex flex-col items-center">
              <h3 class="font-medium text-lg mb-1">Payment Information</h3>
              <p class="text-sm text-center mb-4">Scan QR code to make payment</p>

              <div class="bg-white p-3 rounded shadow-sm mb-4">
                <h4 class="text-blue-600 font-medium mb-2">Techcombank</h4>
                <div class="flex justify-center mb-2">
                  <img :src="selectedBank?.qr_image || '/techcom-qr.png'" alt="Bank QR Code" class="w-48 h-48" />
                </div>
              </div>

              <div class="w-full">
                <div class="flex justify-between py-2 border-b">
                  <span class="font-medium">Account Name:</span>
                  <span>{{ selectedBank?.account_name || 'Thái' }}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="font-medium">Account Number:</span>
                  <span>{{ selectedBank?.account_number || '8524092000' }}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="font-medium">Amount:</span>
                  <span class="font-bold">{{ formatCurrency(grandTotal) }}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="font-medium">Reference:</span>
                  <span>Payment for order</span>
                </div>
              </div>
            </div>

            <n-button type="primary" class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              @click="processQRPayment">
              Complete Payment
            </n-button>
          </template>

          <!-- MoMo payment -->
          <template v-else-if="paymentMethod === 'momo'">
            <div class="border border-gray-200 rounded p-4 bg-gray-50 flex flex-col items-center">
              <h3 class="font-medium text-lg mb-1">MoMo Payment</h3>
              <p class="text-sm text-center mb-4">Scan QR code or click button to pay with MoMo</p>

              <div v-if="momoPaymentUrl" class="bg-white p-3 rounded shadow-sm mb-4">
                <div class="flex justify-center mb-2">
                  <img :src="momoQrCode" alt="MoMo QR Code" class="w-48 h-48" v-if="momoQrCode" />
                  <div v-else class="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    <n-spin size="large" />
                  </div>
                </div>
                <div class="text-center mt-2">
                  <p class="text-sm text-gray-600">Order ID: {{ currentOrderId }}</p>
                </div>
              </div>

              <div class="w-full">
                <div class="flex justify-between py-2 border-b">
                  <span class="font-medium">Amount:</span>
                  <span class="font-bold text-pink-600">{{ formatCurrency(grandTotal) }}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="font-medium">Status:</span>
                  <span class="text-sm">{{ momoPaymentStatus }}</span>
                </div>
              </div>

              <div class="flex gap-2 w-full mt-4">
                <n-button type="primary" class="flex-1" @click="initiateMoMoPayment" :loading="momoLoading"
                  :disabled="momoPaymentUrl">
                  <template #icon>
                    <img src="/momo-icon.svg" class="w-5 h-5" />
                  </template>
                  {{ momoPaymentUrl ? 'Payment Initiated' : 'Pay with MoMo' }}
                </n-button>

                <n-button v-if="momoPaymentUrl" type="info" class="flex-1" @click="openMoMoApp">
                  Open MoMo App
                </n-button>
              </div>

              <div v-if="momoPaymentUrl" class="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-600">
                Waiting for payment confirmation. This page will update automatically.
              </div>
            </div>
          </template>
        </div>
      </n-card>

      <!-- Action buttons -->
      <div class="flex flex-col gap-3 pt-2 flex-shrink-0 pb-4">
        <div class="flex gap-3">
          <n-button type="default"
            class="flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-semibold h-11"
            @click="clearCart">
            Clear All
          </n-button>
          <n-button v-if="paymentMethod === 'cash' || paymentMethod === 'bank' || paymentMethod === 'card'"
            type="primary" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 shadow-md"
            @click="processPayment" :disabled="!canCheckout || paymentProcessing" :loading="paymentProcessing">
            Complete Payment
          </n-button>
        </div>
        <!-- Debug info to help user understand why button is disabled -->
        <div v-if="!canCheckout && cart.length > 0" class="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <div v-if="!selectedCustomer && !(customerMode === 'new' && newCustomerInfo.full_name?.trim())" class="mb-1">
            ⚠️ Please select an existing customer or enter new customer information (name is required).
          </div>
          <div v-else-if="cart.some(item => !item.price || item.price <= 0)" class="mb-1">
            ⚠️ Some items have invalid prices. Please remove and re-add them.
          </div>
          <div v-else-if="paymentMethod === 'cash'">
            💡 You can proceed with amount paid = 0 to create invoice with due amount, or enter the amount paid.
          </div>
          <div
            v-else-if="paymentMethod === 'card' && (!cardInfo.name || !cardInfo.number || !cardInfo.expMonth || !cardInfo.expYear || !cardInfo.cvv)">
            ⚠️ Please complete all card information (name, number, expiry, CVV).
          </div>
          <div v-else-if="paymentMethod === 'bank' && !selectedBank">
            ⚠️ Please select a bank account.
          </div>
          <div v-else-if="!grandTotal || grandTotal <= 0">
            ⚠️ Invalid total amount. Please check cart items.
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase History Modal -->
    <n-modal v-model:show="showPurchaseHistoryModal" preset="card" title="Purchase History" style="max-width: 800px">
      <div v-if="purchaseHistoryData && purchaseHistoryMedicine" class="space-y-4">
        <!-- Medicine Info -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-lg mb-2">{{ purchaseHistoryMedicine.name }}</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div v-if="purchaseHistoryData.daily">
              <span class="text-gray-600">Daily Limit:</span>
              <span class="font-medium ml-2">{{ purchaseHistoryData.daily.limit || 'No limit' }}</span>
            </div>
            <div v-if="purchaseHistoryData.daily">
              <span class="text-gray-600">Daily Purchased:</span>
              <span class="font-medium ml-2" :class="purchaseHistoryData.daily.exceeded ? 'text-red-600' : 'text-green-600'">
                {{ purchaseHistoryData.daily.purchased }}
              </span>
            </div>
            <div v-if="purchaseHistoryData.monthly">
              <span class="text-gray-600">Monthly Limit (30 days):</span>
              <span class="font-medium ml-2">{{ purchaseHistoryData.monthly.limit || 'No limit' }}</span>
            </div>
            <div v-if="purchaseHistoryData.monthly">
              <span class="text-gray-600">Monthly Purchased:</span>
              <span class="font-medium ml-2" :class="purchaseHistoryData.monthly.exceeded ? 'text-red-600' : 'text-green-600'">
                {{ purchaseHistoryData.monthly.purchased }}
              </span>
            </div>
          </div>
        </div>

        <!-- Purchase History Table -->
        <div class="space-y-2">
          <h4 class="font-semibold text-md">Purchase History (Last 30 days)</h4>
          <div v-if="purchaseHistoryData.purchase_history && purchaseHistoryData.purchase_history.length > 0" class="max-h-96 overflow-y-auto">
            <n-data-table
              :columns="[
                { title: 'Date', key: 'date', render: (row) => formatDate(row.date) },
                { title: 'Customer', key: 'customer_name' },
                { title: 'Quantity', key: 'quantity', render: (row) => h('span', { class: 'font-medium' }, row.quantity) },
                { title: 'Invoice ID', key: 'invoice_id', render: (row) => h('span', { class: 'text-xs text-gray-500' }, row.invoice_id.toString().slice(-8)) }
              ]"
              :data="purchaseHistoryData.purchase_history"
              :pagination="{ pageSize: 10 }"
              size="small"
            />
          </div>
          <div v-else class="text-center text-gray-500 py-4">
            No purchase history found for this medicine in the last 30 days
          </div>
        </div>

        <!-- Summary -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm space-y-1">
            <div v-if="purchaseHistoryData.daily && purchaseHistoryData.daily.exceeded" class="text-red-600">
              ⚠️ Daily limit exceeded. Cannot purchase more today.
            </div>
            <div v-if="purchaseHistoryData.monthly && purchaseHistoryData.monthly.exceeded" class="text-orange-600">
              ⚠️ Monthly limit exceeded. Cannot purchase more in this 30-day period.
            </div>
            <div v-if="!purchaseHistoryData.daily?.exceeded && !purchaseHistoryData.monthly?.exceeded" class="text-green-600">
              ✓ Customer can still purchase within limits
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <n-button @click="showPurchaseHistoryModal = false">Close</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, h, watch } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { useRoute } from 'vue-router';
import { api } from '@/utils/api';
import { Trash } from 'lucide-vue-next';
import BarcodeScanner from '@/components/BarcodeScanner.vue';

const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const loading = ref(false);
const searchQuery = ref('');
const activeCategory = ref('all');
const categories = ref([
  { id: 'all', name: 'All' },
  { id: 'Antibiotics', name: 'Antibiotics' },
  { id: 'Painkillers', name: 'Pain killers' },
  { id: 'Antipyretics', name: 'Antipyretics' },
  { id: 'Vitamins', name: 'Vitamins' }
]);
const medicines = ref([]);
const customers = ref([]);
const selectedCustomer = ref(null);
const customerMode = ref<'select' | 'new'>('select');
const newCustomerInfo = ref({
  full_name: '',
  phone: '',
  email: '',
  address: ''
});
const cart = ref([]);
const discount = ref(0);
const voucherCode = ref('');
const voucherApplying = ref(false);
const voucherMessage = ref('');
const appliedVoucher = ref<any | null>(null);
const voucherNeedsRefresh = ref(false);
const voucherBaselineTotal = ref(0);
const paymentMethod = ref('cash');
const amountPaid = ref(0);
const cardInfo = ref({
  name: '',
  number: '',
  expMonth: '',
  expYear: '',
  cvv: ''
});
const testCardOptions = ref([
  { label: '4012888888881881 (Visa)', value: '4012888888881881' },
  { label: '5555555555554444 (Mastercard)', value: '5555555555554444' },
  { label: '371449635398431 (Amex)', value: '371449635398431' },
  { label: '376680816376961 (Amex)', value: '376680816376961' },
  { label: '36259600000004 (Diners)', value: '36259600000004' },
  { label: '6304000000000000 (Maestro)', value: '6304000000000000' },
  { label: '5063516945005047 (Maestro)', value: '5063516945005047' }
]);
const monthOptions = ref([
  { label: '01', value: '01' },
  { label: '02', value: '02' },
  { label: '03', value: '03' },
  { label: '04', value: '04' },
  { label: '05', value: '05' },
  { label: '06', value: '06' },
  { label: '07', value: '07' },
  { label: '08', value: '08' },
  { label: '09', value: '09' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
  { label: '12', value: '12' }
]);
const yearOptions = ref([
  { label: '2024', value: '2024' },
  { label: '2025', value: '2025' },
  { label: '2026', value: '2026' },
  { label: '2027', value: '2027' },
  { label: '2028', value: '2028' },
  { label: '2029', value: '2029' },
  { label: '2030', value: '2030' }
]);
const selectedBank = ref(null);

// Purchase limit history
const showPurchaseHistoryModal = ref(false);
const purchaseHistoryData = ref<any>(null);
const purchaseHistoryMedicine = ref<any>(null);
const momoPaymentUrl = ref(null);
const momoQrCode = ref(null);
const currentOrderId = ref(null);
const momoPaymentStatus = ref('Pending');
const momoLoading = ref(false);

// Format currency
const formatCurrency = (value: number | string | undefined | null) => {
  const numValue = Number(value) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(numValue);
};

// Filter medicines by search and category
const filteredMedicines = computed(() => {
  let filtered = medicines.value;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.category?.name.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(med =>
      med.category?.name === activeCategory.value
    );
  }

  return filtered;
});

// Cart calculations
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const vatTotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    return sum + (itemTotal * (item.vat || 10) / 100);
  }, 0);
});

const orderTotal = computed(() => subtotal.value + vatTotal.value);

watch(orderTotal, (total) => {
  if (appliedVoucher.value) {
    voucherNeedsRefresh.value = total !== voucherBaselineTotal.value;
  }
});

const grandTotal = computed(() => {
  return orderTotal.value - discount.value;
});

const change = computed(() => {
  return Math.max(0, Number(amountPaid.value) - grandTotal.value);
});

const canCheckout = computed(() => {
  // Must have items in cart
  if (cart.value.length === 0) {
    console.log('canCheckout: Cart is empty');
    return false;
  }

  // Validate all items have valid prices
  const hasInvalidItems = cart.value.some(item => !item.price || item.price <= 0 || isNaN(item.price));
  if (hasInvalidItems) {
    console.log('canCheckout: Has invalid items', cart.value.filter(item => !item.price || item.price <= 0));
    return false;
  }

  // Grand total must be valid
  if (!grandTotal.value || grandTotal.value <= 0) {
    console.log('canCheckout: Invalid grand total', grandTotal.value);
    return false;
  }

  // Must have customer information (either selected customer or new customer info)
  const hasCustomer = selectedCustomer.value ||
    (customerMode.value === 'new' && newCustomerInfo.value.full_name?.trim());
  if (!hasCustomer) {
    console.log('canCheckout: No customer information');
    return false;
  }

  // For cash payments, allow even if amount paid is less (will calculate due)
  // But show warning in processPayment if insufficient
  if (paymentMethod.value === 'cash') {
    const paid = Number(amountPaid.value) || 0;
    // Allow checkout even if paid < total (will create invoice with due amount)
    // But warn user in processPayment
    return true;
  }

  // For card payment, check if card info is filled
  if (paymentMethod.value === 'card') {
    const hasCardInfo = !!(cardInfo.value.name?.trim() &&
      cardInfo.value.number &&
      cardInfo.value.expMonth &&
      cardInfo.value.expYear &&
      cardInfo.value.cvv);
    if (!hasCardInfo) {
      console.log('canCheckout: Missing card info', cardInfo.value);
    }
    return hasCardInfo;
  }

  // For bank transfer, check if bank is selected
  if (paymentMethod.value === 'bank') {
    const hasBank = !!selectedBank.value;
    if (!hasBank) {
      console.log('canCheckout: No bank selected');
    }
    return hasBank;
  }

  // For MoMo, always allow (validation happens in initiateMoMoPayment)
  if (paymentMethod.value === 'momo') {
    return true;
  }

  // For other payment methods, allow if cart has items and total is valid
  return true;
});

const canApplyVoucher = computed(() => cart.value.length > 0 && orderTotal.value > 0);

const buildVoucherPayload = (commit = false) => ({
  voucher_code: voucherCode.value,
  customer_id: selectedCustomer.value,
  subtotal: orderTotal.value,
  items: cart.value.map(item => ({
    medicine: item._id,
    quantity: item.quantity,
  })),
  commit,
});

const applyVoucherCode = async () => {
  if (!voucherCode.value?.trim()) {
    message.error('Please enter voucher code');
    return;
  }

  if (!cart.value.length) {
    message.error('Add at least one item before applying voucher');
    return;
  }

  voucherApplying.value = true;
  try {
    const response = await api.post('/api/voucher/apply', buildVoucherPayload(false));
    if (response.status) {
      appliedVoucher.value = response.data;
      discount.value = response.data.discount_amount;
      voucherMessage.value = response.message;
      voucherBaselineTotal.value = orderTotal.value;
      voucherNeedsRefresh.value = false;
      message.success(response.message);
    } else {
      message.error(response.message || 'Failed to apply voucher');
    }
  } catch (error: any) {
    console.error('Apply voucher error:', error);
    message.error(error.message || 'Failed to apply voucher');
  } finally {
    voucherApplying.value = false;
  }
};

const removeVoucher = () => {
  appliedVoucher.value = null;
  voucherCode.value = '';
  voucherMessage.value = '';
  voucherBaselineTotal.value = 0;
  voucherNeedsRefresh.value = false;
  discount.value = 0;
};

// Set active category
const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
};

// Check purchase limit (both daily and monthly) before adding to cart
const checkPurchaseLimit = async (medicine, quantity = 1) => {
  if (!medicine.max_quantity_per_day && !medicine.max_quantity_per_month) {
    return { can_purchase: true };
  }

  // If it's a new customer (no customer_id yet), no need to check limit
  // because they haven't purchased anything yet. Check will be performed when submitting invoice (customer will be created then)
  const isNewCustomer = customerMode.value === 'new' && newCustomerInfo.value.full_name?.trim();
  if (isNewCustomer && !selectedCustomer.value) {
    return { can_purchase: true, warning: 'New customer - will check limit at checkout' };
  }

  // If no customer is selected or entered, show error
  if (!selectedCustomer.value && !isNewCustomer) {
    return {
      can_purchase: false,
      message: 'Please select or enter customer information to check purchase limit'
    };
  }

  try {
    const customerId = selectedCustomer.value;
    if (!customerId) {
      // Nếu là customer mới, cho phép add to cart, check sẽ được thực hiện khi submit
      return { can_purchase: true };
    }

    const response = await api.post('/api/invoice/check-purchase-limit', {
      medicine_id: medicine._id,
      customer_id: customerId,
      quantity: quantity
    });

    if (response.status && response.can_purchase !== undefined) {
      return response;
    }
    return { can_purchase: true };
  } catch (error) {
    console.error('Error checking purchase limit:', error);
    // If check fails and it's a new customer, allow add to cart
    if (isNewCustomer) {
      return { can_purchase: true, warning: 'Cannot check purchase limit. Will check at checkout.' };
    }
    // If it's an existing customer and check fails, still allow but warn
    return { can_purchase: true, warning: 'Cannot check purchase limit' };
  }
};

// Show purchase history modal
const showPurchaseHistory = (medicine, historyData) => {
  purchaseHistoryMedicine.value = medicine;
  purchaseHistoryData.value = historyData;
  showPurchaseHistoryModal.value = true;
};

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Add medicine to cart
const addToCart = async (medicine) => {
  console.log('Adding medicine to cart:', medicine);

  // Check if medicine has stock
  if (!medicine.stocks || medicine.stocks.length === 0) {
    console.warn(`${medicine.name} has no stocks:`, medicine.stocks);
    message.error(`${medicine.name} is out of stock`);
    return;
  }

  // Check purchase limit if medicine has max_quantity_per_day or max_quantity_per_month
  if (medicine.max_quantity_per_day || medicine.max_quantity_per_month) {
    const limitCheck = await checkPurchaseLimit(medicine, 1);
    if (!limitCheck.can_purchase) {
      // Show error with option to view purchase history
      dialog.error({
        title: 'Purchase Limit Exceeded',
        content: () => h('div', { class: 'space-y-2' }, [
          h('p', { class: 'text-red-600 font-medium' }, `Medicine "${medicine.name}" has exceeded the purchase limit`),
          h('p', { class: 'text-sm' }, limitCheck.message),
          limitCheck.daily && h('div', { class: 'text-sm bg-red-50 p-2 rounded mt-2' }, [
            h('strong', 'Daily Limit: '),
            `${limitCheck.daily.purchased}/${limitCheck.daily.limit} units purchased today. Remaining: ${limitCheck.daily.remaining}`
          ]),
          limitCheck.monthly && h('div', { class: 'text-sm bg-orange-50 p-2 rounded mt-2' }, [
            h('strong', 'Monthly Limit (30 days): '),
            `${limitCheck.monthly.purchased}/${limitCheck.monthly.limit} units purchased. Remaining: ${limitCheck.monthly.remaining}`
          ]),
        ]),
        positiveText: 'View Purchase History',
        negativeText: 'Close',
        onPositiveClick: () => {
          showPurchaseHistory(medicine, limitCheck);
        }
      });
      return;
    }
    
    // Show warnings if approaching limits
    const warnings = [];
    if (limitCheck.daily && limitCheck.daily.limit && limitCheck.daily.remaining < limitCheck.daily.limit) {
      warnings.push(`Daily: ${limitCheck.daily.remaining}/${limitCheck.daily.limit} remaining`);
    }
    if (limitCheck.monthly && limitCheck.monthly.limit && limitCheck.monthly.remaining < limitCheck.monthly.limit) {
      warnings.push(`Monthly: ${limitCheck.monthly.remaining}/${limitCheck.monthly.limit} remaining`);
    }
    if (warnings.length > 0) {
      message.warning(`"${medicine.name}" - ${warnings.join(', ')}`);
    }
  }

  // Select the newest stock that is not expired
  const validStocks = medicine.stocks.filter(stock =>
    stock.unit_quantity > 0 &&
    new Date(stock.expiry_date) > new Date()
  );

  console.log('Valid stocks found:', validStocks.length);

  if (validStocks.length === 0) {
    message.error(`${medicine.name} is out of stock or expired`);
    return;
  }

  // Sort by expiry date ascending (FIFO)
  validStocks.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const stock = validStocks[0];

  // Calculate days left until expiry
  const today = new Date();
  const expiryDate = new Date(stock.expiry_date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine discount based on expiry status
  let discountPercentage = 0;
  let discountReason = '';

  if (daysLeft <= 7) {
    // Critical - 50% discount
    discountPercentage = 50;
    discountReason = 'Critical expiry (≤ 7 days)';
  } else if (daysLeft <= 30) {
    // Warning - 20% discount
    discountPercentage = 20;
    discountReason = 'Warning expiry (≤ 30 days)';
  }

  // Calculate discounted price - ensure we get the correct price
  // Priority: stock.mrp > medicine.price > 0
  let originalPrice = 0;

  // Try to get price from stock.mrp first, but validate it's reasonable
  // If stock.mrp is too small (likely wrong data), use medicine.price instead
  if (stock.mrp !== undefined && stock.mrp !== null) {
    const mrpValue = Number(stock.mrp);
    // Only use stock.mrp if it's a valid number and seems reasonable (>= 100 VND)
    // This prevents using incorrect small values like 8, 10, etc.
    if (!isNaN(mrpValue) && mrpValue >= 100) {
      originalPrice = mrpValue;
      console.log(`[addToCart] Using stock.mrp for ${medicine.name}:`, mrpValue);
    } else {
      console.warn(`[addToCart] stock.mrp seems invalid for ${medicine.name}:`, mrpValue, 'using medicine.price instead');
    }
  }

  // Use medicine.price if stock.mrp is not available, invalid, or too small
  if (originalPrice <= 0 && medicine.price !== undefined && medicine.price !== null) {
    const priceValue = Number(medicine.price);
    if (!isNaN(priceValue) && priceValue > 0) {
      originalPrice = priceValue;
      console.log(`[addToCart] Using medicine.price for ${medicine.name}:`, priceValue);
    }
  }

  // Debug log to check what values we're getting
  console.log(`[addToCart] Price calculation for ${medicine.name}:`, {
    stock_mrp: stock.mrp,
    stock_mrp_type: typeof stock.mrp,
    medicine_price: medicine.price,
    medicine_price_type: typeof medicine.price,
    calculated_originalPrice: originalPrice,
    stock: stock
  });

  // Final validation - if still no valid price, show error
  if (originalPrice <= 0 || isNaN(originalPrice)) {
    console.error('Price calculation failed:', {
      medicine: medicine.name,
      stock_mrp: stock.mrp,
      medicine_price: medicine.price,
      stock: stock
    });
    message.error(`${medicine.name} has no valid price. Please check stock MRP or medicine price.`);
    return;
  }

  // Calculate discounted price
  const discountedPrice = discountPercentage > 0
    ? Math.round(originalPrice * (1 - discountPercentage / 100))
    : originalPrice;

  // Ensure discounted price is still valid
  if (discountedPrice <= 0 || isNaN(discountedPrice)) {
    console.error('Discounted price calculation failed:', {
      originalPrice,
      discountPercentage,
      discountedPrice
    });
    message.error(`Failed to calculate price for ${medicine.name}. Please try again.`);
    return;
  }

  const existingItem = cart.value.find(item =>
    item._id === medicine._id && item.batch_id === stock.batch_id
  );

  if (existingItem) {
    // Check daily limit when increasing quantity
    if (medicine.max_quantity_per_day) {
      const newQuantity = existingItem.quantity + 1;
      const limitCheck = await checkDailyLimit(medicine, newQuantity);
      if (!limitCheck.can_purchase) {
        message.error(limitCheck.message || `Cannot add. Daily purchase limit exceeded`);
        return;
      }
    }

    if (existingItem.quantity < existingItem.max_quantity) {
      existingItem.quantity += 1;

      // Update the stock quantity in the UI immediately
      stock.unit_quantity -= 1;

      message.success(`Added ${medicine.name} to cart`);

      // Show discount message if applicable
      if (discountPercentage > 0) {
        message.info(`${discountReason}: ${discountPercentage}% discount applied`);
      }
    } else {
      message.warning(`Cannot add more. Only ${existingItem.max_quantity} ${medicine.name} available in batch ${stock.batch_id}`);
    }
  } else {
    // Store the original stock quantity before decreasing
    const originalQuantity = stock.unit_quantity;

    // Update the stock quantity in the UI immediately
    stock.unit_quantity -= 1;

    // Final validation - ensure prices are valid numbers
    const finalPrice = Math.round(Number(discountedPrice));
    const finalOriginalPrice = Math.round(Number(originalPrice));

    // Double check prices are valid
    if (isNaN(finalPrice) || finalPrice <= 0 || isNaN(finalOriginalPrice) || finalOriginalPrice <= 0) {
      console.error('Invalid price calculated:', {
        discountedPrice,
        originalPrice,
        finalPrice,
        finalOriginalPrice,
        stock: {
          mrp: stock.mrp,
          _id: stock._id,
          batch_id: stock.batch_id
        },
        medicine: {
          name: medicine.name,
          price: medicine.price,
          _id: medicine._id
        }
      });
      message.error(`Error: Cannot determine price for ${medicine.name}. Please check stock MRP or medicine price.`);
      // Restore stock quantity
      stock.unit_quantity += 1;
      return;
    }

    const cartItem = {
      _id: medicine._id,
      name: medicine.name,
      original_price: finalOriginalPrice,
      price: finalPrice,
      discount_percentage: discountPercentage,
      discount_reason: discountReason,
      vat: Number(stock.vat) || 10,
      quantity: 1,
      batch_id: stock.batch_id,
      expiry_date: stock.expiry_date,
      max_quantity: originalQuantity, // Store original quantity for reference
      stock_id: stock._id,
      purchase: stock.purchase,
      days_left: daysLeft,
      medicine: medicine._id // Store medicine ID for reference
    };

    cart.value.push(cartItem);

    console.log('Added to cart:', {
      name: medicine.name,
      price: finalPrice,
      original_price: finalOriginalPrice,
      quantity: 1,
      stock_mrp: stock.mrp,
      medicine_price: medicine.price,
      discountedPrice,
      originalPrice
    });

    message.success(`Added ${medicine.name} to cart`);

    // Show discount message if applicable
    if (discountPercentage > 0) {
      message.info(`${discountReason}: ${discountPercentage}% discount applied`);
    }
  }
};

// Remove item from cart
const removeItem = (index) => {
  const item = cart.value[index];
  if (item) {
    // Find the medicine to restore its stock
    const medicine = medicines.value.find(med => med._id === item._id);
    if (medicine) {
      // Find the specific stock batch
      const stock = medicine.stocks.find(s => s._id === item.stock_id);
      if (stock) {
        // Restore the stock quantity
        stock.unit_quantity += item.quantity;
        console.log(`Restored ${item.quantity} units to stock of ${item.name}`);
      }
    }
  }
  // Remove from cart
  cart.value.splice(index, 1);
};

// Clear cart
const clearCart = () => {
  // Restore stock quantities for all items in the cart
  cart.value.forEach(item => {
    // Find the medicine to restore its stock
    const medicine = medicines.value.find(med => med._id === item._id);
    if (medicine) {
      // Find the specific stock batch
      const stock = medicine.stocks.find(s => s._id === item.stock_id);
      if (stock) {
        // Restore the stock quantity
        stock.unit_quantity += item.quantity;
        console.log(`Restored ${item.quantity} units to stock of ${item.name}`);
      }
    }
  });

  // Clear the cart and reset other values
  cart.value = [];
  discount.value = 0;
  amountPaid.value = 0;
  selectedCustomer.value = null;
  customerMode.value = 'select';
  clearNewCustomer();
  cardInfo.value = {
    name: '',
    number: '',
    expMonth: '',
    expYear: '',
    cvv: ''
  };
  removeVoucher();
};

// Process payment
const paymentProcessing = ref(false);

// Shift management
const activeShift = ref<any | null>(null);
const availableShifts = ref<any[]>([]);
const selectedShiftId = ref<string | null>(null);
const startingShift = ref(false);
const endingShift = ref(false);
const employees = ref<any[]>([]);

const processPayment = async () => {
  // Validate cart
  if (cart.value.length === 0) {
    message.error('Cart is empty. Please add items to cart.');
    return;
  }

  // Validate cart items have valid prices
  const invalidItems = cart.value.filter(item => !item.price || item.price <= 0);
  if (invalidItems.length > 0) {
    console.error('Invalid items in cart:', invalidItems);
    message.error(`Some items have invalid prices. Please remove and re-add them.`);
    return;
  }

  // Validate customer information is required
  const hasCustomer = selectedCustomer.value ||
    (customerMode.value === 'new' && newCustomerInfo.value.full_name?.trim());
  if (!hasCustomer) {
    message.error('Please select an existing customer or enter new customer information.');
    return;
  }

  // Validate payment based on method
  if (paymentMethod.value === 'cash') {
    const paid = Number(amountPaid.value) || 0;
    const total = grandTotal.value;

    // Allow payment even if paid < total (will create invoice with due amount)
    // But show dialog if paid is 0
    if (paid === 0) {
      dialog.warning({
        title: 'Confirm Payment',
        content: `Amount paid is 0. Do you want to create an invoice with full amount due (${formatCurrency(total)})?`,
        positiveText: 'Yes, Create Invoice',
        positiveButtonProps: {
          type: 'primary',
          class: '!bg-blue-600 hover:!bg-blue-700 text-white font-semibold',
        },
        negativeText: 'Cancel',
        negativeButtonProps: {
          type: 'warning',
          class: '!bg-red-600 hover:!bg-red-700 text-white font-semibold',
        },
        onPositiveClick: () => {
          proceedWithPayment();
        },
        onNegativeClick: () => {
          message.info('Please enter the amount paid or adjust the payment.');
        }
      });
      return;
    } else if (paid < total) {
      // Show info message but allow to proceed (will create invoice with due)
      message.info(`Amount paid (${formatCurrency(paid)}) is less than total (${formatCurrency(total)}). Invoice will be created with due amount: ${formatCurrency(total - paid)}`);
    }
  }

  // Proceed with payment if not cash with 0 amount
  proceedWithPayment();
};

// Helper function to parse and show daily limit error
const parseAndShowDailyLimitError = (errorMessage: string) => {
  // Extract details from error message
  // Format: "Medicine "X" has exceeded the daily purchase limit for this customer. Daily limit per customer: Y units, Already purchased today: Z units, Requested: A units, Remaining: B units"
  const medicineMatch = errorMessage.match(/Medicine\s+"([^"]+)"/) || errorMessage.match(/Thuốc\s+"([^"]+)"/);

  // Try new format first
  let maxLimit = errorMessage.match(/Daily limit per customer:\s*(\d+)/)?.[1];
  let purchased = errorMessage.match(/Already purchased today:\s*(\d+)/)?.[1];
  let requested = errorMessage.match(/Requested:\s*(\d+)/)?.[1];
  let remaining = errorMessage.match(/Remaining:\s*(-?\d+)/)?.[1];

  // Fallback to old format if new format not found
  if (!maxLimit || !purchased) {
    const purchasedMatch = errorMessage.match(/Already purchased:\s*(\d+)\/(\d+)/) || errorMessage.match(/Đã mua:\s*(\d+)\/(\d+)/);
    if (purchasedMatch) {
      purchased = purchasedMatch[1];
      maxLimit = purchasedMatch[2];
    }
  }

  if (!requested) {
    requested = errorMessage.match(/Requested:\s*(\d+)/)?.[1] || errorMessage.match(/Yêu cầu:\s*(\d+)/)?.[1];
  }

  if (!remaining) {
    remaining = errorMessage.match(/Remaining:\s*(-?\d+)/)?.[1] || errorMessage.match(/Còn lại:\s*(-?\d+)/)?.[1];
  }

  const medicineName = medicineMatch ? medicineMatch[1] : 'Unknown';
  purchased = purchased || '0';
  maxLimit = maxLimit || '0';
  requested = requested || '0';
  remaining = remaining || '0';

  // Show detailed error in a dialog for better visibility
  dialog.error({
    title: 'Daily Purchase Limit Exceeded',
    content: () => h('div', { style: 'white-space: pre-line; line-height: 1.6;' }, [
      h('p', { style: 'font-weight: 600; margin-bottom: 12px; color: #d32f2f; font-size: 16px;' }, `Medicine: ${medicineName}`),
      h('div', { style: 'margin: 12px 0; padding: 16px; background: #f5f5f5; border-radius: 4px; border-left: 4px solid #d32f2f;' }, [
        h('p', { style: 'margin: 8px 0; font-weight: 600; color: #333;' }, 'Daily Limit Per Customer:'),
        h('p', { style: 'margin: 4px 0 16px 20px; color: #666; font-size: 15px;' }, `${maxLimit} units`),
        h('p', { style: 'margin: 8px 0; font-weight: 600; color: #333;' }, 'Already Purchased Today (This Customer):'),
        h('p', { style: 'margin: 4px 0 16px 20px; color: #666; font-size: 15px;' }, `${purchased} units`),
        h('p', { style: 'margin: 8px 0; font-weight: 600; color: #333;' }, 'Requested Quantity:'),
        h('p', { style: 'margin: 4px 0 16px 20px; color: #666; font-size: 15px;' }, `${requested} units`),
        h('p', { style: 'margin: 8px 0; font-weight: 600; color: #d32f2f;' }, 'Remaining Available:'),
        h('p', { style: 'margin: 4px 0 0 20px; color: #d32f2f; font-weight: 600; font-size: 15px;' }, `${remaining} units`),
      ]),
      h('div', { style: 'margin-top: 16px; padding: 12px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #1976d2;' }, [
        h('p', { style: 'margin: 0; color: #1976d2; font-size: 13px; line-height: 1.5;' }, 'ℹ️ Note: Each customer has their own daily limit. Other customers can still purchase up to their limit.'),
      ]),
      h('p', { style: 'margin-top: 16px; color: #666; font-size: 14px; font-weight: 500;' }, 'Please reduce the quantity or try again tomorrow.'),
    ]),
    positiveText: 'OK',
    positiveButtonProps: {
      type: 'primary',
      class: "bg-[#167b56] text-white hover:bg-[#0f5d40]"
    },
    onPositiveClick: () => {
      // Do nothing, just close
    }
  });
};

// Separate function to proceed with payment
const proceedWithPayment = async () => {
  // For MoMo payment, we use a different flow - handled by initiateMoMoPayment
  if (paymentMethod.value === 'momo') {
    await initiateMoMoPayment();
    return;
  }

  // Validate voucher
  if (appliedVoucher.value && voucherNeedsRefresh.value) {
    message.warning('Cart changed after applying voucher. Please re-apply the voucher code or remove it.');
    return;
  }

  if (paymentProcessing.value) {
    message.warning('Payment is already being processed. Please wait...');
    return; // Prevent multiple submissions
  }

  // Log payment details for debugging
  console.log('Processing payment:', {
    paymentMethod: paymentMethod.value,
    cartItems: cart.value.length,
    subtotal: subtotal.value,
    vatTotal: vatTotal.value,
    discount: discount.value,
    grandTotal: grandTotal.value,
    amountPaid: amountPaid.value,
    customer: selectedCustomer.value,
    hasNewCustomer: customerMode.value === 'new' && newCustomerInfo.value.full_name?.trim(),
    voucher: appliedVoucher.value?.voucher_code
  });

  paymentProcessing.value = true;

  try {
    // Generate an invoice ID for all payment methods
    const invoiceId = `INV-CUS-${Date.now()}`;
    console.log("Generated invoice ID for payment:", invoiceId);

    const invoiceData = {
      _id: invoiceId, // Set the _id explicitly
      date: Date.now(),
      customer: selectedCustomer.value,
      items: cart.value.map(item => ({
        medicine: item._id,
        medicine_name: item.name, // Store medicine name directly
        quantity: item.quantity,
        price: item.price,
        original_price: item.original_price || item.price,
        discount_percentage: item.discount_percentage || 0,
        discount_reason: item.discount_reason || '',
        vat: item.vat,
        subtotal: item.price * item.quantity,
        batch_id: item.batch_id,
        expiry_date: item.expiry_date,
        purchase: item.purchase,
        stock_id: item.stock_id,
        days_left: item.days_left
      })),
      subtotal: subtotal.value,
      vat_total: vatTotal.value,
      discount: discount.value,
      grand_total: grandTotal.value,
      paid: paymentMethod.value === 'cash' ? Number(amountPaid.value) : grandTotal.value,
      due: paymentMethod.value === 'cash'
        ? Number(amountPaid.value) > grandTotal.value
          ? 0 // No due amount if paid more than total
          : grandTotal.value - Number(amountPaid.value) // Calculate due if paid less than total
        : 0, // No due for other payment methods
      payment_method: paymentMethod.value,
      payment_status: 'paid',
      payment_details: paymentMethod.value === 'card'
        ? {
          card_type: getCardType(cardInfo.value.number),
          card_number: maskCardNumber(cardInfo.value.number),
          card_holder: cardInfo.value.name
        }
        : null,
      is_pos: true
    };

    // Add new customer details if entered
    if (customerMode.value === 'new' && newCustomerInfo.value.full_name?.trim()) {
      invoiceData.customer_details = {
        full_name: newCustomerInfo.value.full_name.trim(),
        contact_info: {
          phone: newCustomerInfo.value.phone?.trim() || '',
          email: newCustomerInfo.value.email?.trim() || '',
          address: newCustomerInfo.value.address?.trim() || '',
        },
      };
    }

    if (appliedVoucher.value) {
      invoiceData.voucher_code = appliedVoucher.value.voucher_code;
      invoiceData.voucher_discount = appliedVoucher.value.discount_amount;
      invoiceData.voucher = appliedVoucher.value.voucher_id;
    }

    // Add shift_id if active shift exists
    if (activeShift.value) {
      invoiceData.shift_id = activeShift.value._id;
      invoiceData.employee_id = activeShift.value.employee._id || activeShift.value.employee;
    }

    console.log("Creating POS invoice with data:", invoiceData);

    // Submit invoice to POS API endpoint
    const response = await api.post('/api/invoice/pos', invoiceData);

    if (response && response.status) {
      message.success('Transaction completed successfully');
      clearCart();

      // Reload medicine data to reflect updated stock quantities in the database
      await fetchMedicines();
    } else {
      // Handle error response from API
      const errorMsg = response?.error || response?.message || 'Failed to create invoice';
      console.error('Invoice creation failed:', response);

      // Parse and display detailed error if it's a daily limit error
      if (errorMsg.includes('exceeded the daily purchase limit') ||
        errorMsg.includes('vượt quá giới hạn mua trong ngày')) {
        parseAndShowDailyLimitError(errorMsg);
      } else {
        message.error(errorMsg);
      }
    }
  } catch (error: any) {
    console.error('Payment error:', error);

    // Extract error message from response if available
    let errorMessage = 'Failed to process payment';

    // Try to get error message from different possible locations
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Parse and display detailed error if it's a daily limit error
    if (errorMessage.includes('exceeded the daily purchase limit') ||
      errorMessage.includes('vượt quá giới hạn mua trong ngày')) {
      parseAndShowDailyLimitError(errorMessage);
      return; // Return early to prevent showing generic error
    }

    // Display generic error message
    message.error(errorMessage, {
      duration: 5000,
      closable: true
    });
  } finally {
    paymentProcessing.value = false;
  }
};

// Fetch medicines
const fetchMedicines = async () => {
  loading.value = true;
  try {
    // Get medicines and populate stock information
    // Add timestamp to prevent caching issues
    const timestamp = Date.now();
    const response = await api.get('/api/medicine', {
      params: {
        limit: 100,
        populate: 'stocks',
        _t: timestamp // Add timestamp to force fresh data
      }
    });

    if (response && response.data) {
      medicines.value = response.data;

      // Extract unique categories
      const uniqueCategories = new Set(['all']);
      response.data.forEach(med => {
        if (med.category?.name) {
          uniqueCategories.add(med.category.name);
        }
      });

      categories.value = Array.from(uniqueCategories).map(cat => {
        return { id: cat, name: cat === 'all' ? 'All' : cat };
      });
    }
  } catch (error) {
    console.error('Failed to fetch medicines:', error);
    message.error('Could not load medicine data');
  } finally {
    loading.value = false;
  }
};

// Fetch customers
const fetchCustomers = async () => {
  try {
    const response = await api.get('/api/customers', { params: { limit: 100 } });
    if (response && response.data) {
      customers.value = response.data.map(item => ({ label: item.full_name || item.customer_id, value: item._id }));
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

// Handle customer selection
const handleCustomerSelect = (value: string | null) => {
  if (value) {
    customerMode.value = 'select';
    clearNewCustomer();
  }
};

// Clear new customer info
const clearNewCustomer = () => {
  newCustomerInfo.value = {
    full_name: '',
    phone: '',
    email: '',
    address: ''
  };
};

// Function to get available stock for a medicine
const getMedicineAvailableStock = (medicine) => {
  if (!medicine.stocks || medicine.stocks.length === 0) {
    return 0;
  }

  // Filter valid stocks (not expired), including those with zero quantity
  const validStocks = medicine.stocks.filter(stock =>
    new Date(stock.expiry_date) > new Date()
  );

  // Sum up available quantities
  return validStocks.reduce((total, stock) => total + (stock.unit_quantity || 0), 0);
};

// Function to get display price for medicine (priority: stock.mrp > medicine.price)
const getMedicineDisplayPrice = (medicine) => {
  // Always use medicine.price for display in grid
  // The stock.mrp will be used when adding to cart
  if (medicine.price !== undefined && medicine.price !== null) {
    const priceValue = Number(medicine.price);
    if (!isNaN(priceValue) && priceValue > 0) {
      return priceValue;
    }
  }

  // Fallback: If medicine has stocks, try to get MRP from the first valid stock
  if (medicine.stocks && medicine.stocks.length > 0) {
    // Filter valid stocks (not expired and have quantity)
    const validStocks = medicine.stocks.filter(stock =>
      stock.unit_quantity > 0 &&
      new Date(stock.expiry_date) > new Date()
    );

    if (validStocks.length > 0) {
      // Sort by expiry date (FIFO) to get the stock that would be used first
      validStocks.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      const stock = validStocks[0];

      // Try to get price from stock.mrp first
      if (stock.mrp !== undefined && stock.mrp !== null) {
        const mrpValue = Number(stock.mrp);
        if (!isNaN(mrpValue) && mrpValue > 0) {
          return mrpValue;
        }
      }
    }
  }

  return 0;
};

// Update cart total
const updateCartTotal = () => {
  // Make sure each item's total is correctly calculated with the discounted price
  cart.value.forEach(item => {
    // Ensure original_price and price are valid numbers
    if (!item.original_price || item.original_price <= 0) {
      console.warn('Item missing original_price:', item);
      // Try to get price from medicine if available
      const medicine = medicines.value.find(med => med._id === item._id);
      if (medicine && medicine.price) {
        item.original_price = Number(medicine.price);
      } else {
        console.error('Cannot recover price for item:', item.name);
        return; // Skip this item
      }
    }

    // Recalculate discounted price if discount exists
    if (item.discount_percentage && item.discount_percentage > 0) {
      const recalculatedPrice = Math.round(item.original_price * (1 - item.discount_percentage / 100));
      if (recalculatedPrice > 0 && !isNaN(recalculatedPrice)) {
        item.price = recalculatedPrice;
      }
    } else if (!item.price || item.price <= 0) {
      // If no discount, price should equal original_price
      item.price = item.original_price;
    }

    // Validate final price
    if (!item.price || item.price <= 0 || isNaN(item.price)) {
      console.error('Invalid item price after recalculation:', item);
      // Try to set price from original_price as fallback
      if (item.original_price && item.original_price > 0) {
        item.price = item.original_price;
      }
    }

    // Find the medicine to update its stock
    const medicine = medicines.value.find(med => med._id === item._id);
    if (medicine) {
      // Find the specific stock batch
      const stock = medicine.stocks.find(s => s._id === item.stock_id);
      if (stock) {
        // Calculate the new stock quantity based on the max_quantity (original) and current item quantity
        const originalQuantity = item.max_quantity;
        stock.unit_quantity = originalQuantity - item.quantity;
      }
    }
  });

  // Computed properties will handle recalculation automatically
};

// Process card payment
const processCardPayment = () => {
  // Validate card information
  if (!cardInfo.value.name.trim()) {
    message.error('Please enter the cardholder name');
    return;
  }

  if (!cardInfo.value.number) {
    message.error('Please select a card number');
    return;
  }

  if (!cardInfo.value.expMonth) {
    message.error('Please select expiry month');
    return;
  }

  if (!cardInfo.value.expYear) {
    message.error('Please select expiry year');
    return;
  }

  // Check if expiry date is valid
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  const expYear = parseInt(cardInfo.value.expYear);
  const expMonth = parseInt(cardInfo.value.expMonth);

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    message.error('Card has expired. Please use a valid expiry date');
    return;
  }

  if (!cardInfo.value.cvv || cardInfo.value.cvv.length < 3) {
    message.error('Please enter a valid CVV');
    return;
  }

  // Process payment
  message.success('Card payment successful');
  processPayment();
};

// Process QR payment
const processQRPayment = () => {
  // In a real implementation, this would show a QR code and wait for callback confirmation
  message.success('Bank transfer payment successful');
  processPayment();
};

// Utility functions for card processing
const getCardType = (number) => {
  if (!number) return '';

  // Visa
  if (/^4/.test(number)) return 'Visa';

  // Mastercard
  if (/^5[1-5]/.test(number)) return 'Mastercard';

  // Amex
  if (/^3[47]/.test(number)) return 'American Express';

  // Discover
  if (/^6(?:011|5)/.test(number)) return 'Discover';

  return 'Unknown';
};

const maskCardNumber = (number) => {
  if (!number) return '';

  const lastFour = number.slice(-4);
  const masked = '*'.repeat(number.length - 4);

  return masked + lastFour;
};

// Fetch bank accounts
const fetchBankAccounts = async () => {
  try {
    const response = await api.get('/api/bank', {
      params: { limit: 1, status: true }
    });

    if (response && response.data && response.data.length > 0) {
      selectedBank.value = response.data[0];
    }
  } catch (error) {
    console.error('Failed to fetch bank account:', error);
  }
};

// Fetch employees
const fetchEmployees = async () => {
  try {
    const response = await api.get('/api/hr/employee', {
      params: { status: 'active', limit: 100 }
    });
    if (response && response.status && response.data) {
      employees.value = Array.isArray(response.data) ? response.data : [];
    }
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    employees.value = [];
  }
};

// Fetch available shifts (scheduled shifts that can be started)
const fetchAvailableShifts = async () => {
  try {
    const response = await api.get('/api/hr/shift', {
      params: {
        status: 'scheduled'
      }
    });

    if (response && response.status && response.data) {
      const shifts = Array.isArray(response.data) ? response.data : [];
      // Filter shifts that are today or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validShifts = shifts.filter((shift: any) => {
        const shiftDate = new Date(shift.shift_date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate >= today;
      });

      // Format shifts for select dropdown
      availableShifts.value = validShifts.map((shift: any) => {
        const shiftDate = new Date(shift.shift_date);
        const dateStr = shiftDate.toLocaleDateString('vi-VN');
        return {
          label: `${shift.employee?.full_name || shift.employee?.name || 'N/A'} - ${getShiftTypeLabel(shift.shift_type)} (${dateStr} ${shift.start_time} - ${shift.end_time})`,
          value: shift._id,
          shift: shift
        };
      });
    } else {
      availableShifts.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch available shifts:', error);
    availableShifts.value = [];
  }
};

// Fetch active shift
const fetchActiveShift = async () => {
  try {
    const response = await api.get('/api/hr/shift/get-active-shift');
    if (response && response.status && response.data) {
      activeShift.value = response.data;
    } else {
      activeShift.value = null;
    }
  } catch (error) {
    console.error('Failed to fetch active shift:', error);
    activeShift.value = null;
  }
};

// Get shift type label
const getShiftTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'morning': 'Morning',
    'afternoon': 'Afternoon',
    'evening': 'Evening',
    'night': 'Night',
    'full-day': 'Full Day',
  };
  return typeMap[type] || type;
};

// Handle shift selection
const handleShiftSelect = (value: string | null) => {
  selectedShiftId.value = value;
};

// Start shift
const handleStartShift = async () => {
  if (!selectedShiftId.value) {
    message.error('Please select a shift');
    return;
  }

  startingShift.value = true;
  try {
    const response = await api.post('/api/hr/shift/start-shift', {
      shift_id: selectedShiftId.value,
      opening_balance: 0,
    });

    if (response && response.status) {
      message.success('Shift started successfully');
      selectedShiftId.value = null;
      await fetchActiveShift();
      await fetchAvailableShifts();
    } else {
      message.error(response?.message || 'Error starting shift');
    }
  } catch (error: any) {
    console.error('Failed to start shift:', error);
    message.error(error?.message || 'Error starting shift');
  } finally {
    startingShift.value = false;
  }
};

// End shift
const handleEndShift = async () => {
  if (!activeShift.value) {
    message.error('No active shift');
    return;
  }

  endingShift.value = true;
  try {
    const response = await api.post('/api/hr/shift/end-shift', {
      shift_id: activeShift.value._id,
      closing_balance: activeShift.value.opening_balance || 0,
      notes: '',
    });

    if (response && response.status) {
      message.success('Shift ended successfully');
      activeShift.value = null;
      await fetchAvailableShifts();
    } else {
      message.error(response?.message || 'Error ending shift');
    }
  } catch (error: any) {
    console.error('Failed to end shift:', error);
    message.error(error?.message || 'Error ending shift');
  } finally {
    endingShift.value = false;
  }
};

// Process barcode scan
const onBarcodeScanned = async (barcode) => {
  if (!barcode) return;

  // Show loading message
  message.loading('Scanning product barcode...');
  console.log(`Scanning barcode: ${barcode}`);

  try {
    // Search for medicine by barcode
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await api.get('/api/medicine', {
      params: {
        bar_code: barcode,
        populate: 'stocks',
        limit: 1,
        _t: timestamp // Add timestamp to force fresh data
      }
    });

    console.log('Barcode search response:', response);

    if (response && response.data && response.data.length > 0) {
      const medicine = response.data[0];
      console.log('Found medicine:', medicine.name, 'with ID:', medicine._id);

      // Add the medicine to cart
      addToCart(medicine);
      message.success(`Found and added ${medicine.name} to cart`);
    } else {
      message.error(`Barcode ${barcode} not found in system`);
    }
  } catch (error) {
    console.error('Barcode scan error:', error);
    message.error('Failed to process barcode');
  }
};

// Process MoMo payment
const initiateMoMoPayment = async () => {
  if (cart.value.length === 0) {
    message.error('Cart is empty');
    return;
  }

  if (momoLoading.value) return; // Prevent multiple submissions

  momoLoading.value = true;

  try {
    // Tạo invoice ID
    currentOrderId.value = `INV-CUS-${Date.now()}`;

    // Tạo invoice trước với trạng thái 'pending'
    const invoiceData = {
      _id: currentOrderId.value,
      date: Date.now(),
      customer: selectedCustomer.value,
      items: cart.value.map(item => ({
        medicine: item._id,
        medicine_name: item.name, // Store medicine name directly
        quantity: item.quantity,
        price: item.price,
        original_price: item.original_price || item.price,
        discount_percentage: item.discount_percentage || 0,
        discount_reason: item.discount_reason || '',
        vat: item.vat,
        subtotal: item.price * item.quantity,
        batch_id: item.batch_id,
        expiry_date: item.expiry_date,
        purchase: item.purchase,
        stock_id: item.stock_id,
        days_left: item.days_left
      })),
      subtotal: subtotal.value,
      vat_total: vatTotal.value,
      discount: discount.value,
      grand_total: grandTotal.value,
      paid: grandTotal.value, // Đã thanh toán đầy đủ
      due: 0, // Không còn nợ
      payment_method: 'momo',
      payment_status: 'paid', // Đánh dấu đã thanh toán
      payment_details: {
        order_id: currentOrderId.value
      },
      is_pos: true
    };

    // Tạo invoice trước
    console.log("Creating invoice before MoMo payment:", invoiceData);
    const invoiceResponse = await api.post('/api/invoice/pos', invoiceData);

    if (!invoiceResponse || !invoiceResponse.status) {
      throw new Error(invoiceResponse?.message || 'Failed to create invoice');
    }

    console.log("Invoice created successfully:", invoiceResponse);

    // Sau đó gửi yêu cầu thanh toán đến MoMo
    const response = await api.post('/api/payment/momo', {
      amount: grandTotal.value,
      orderId: currentOrderId.value,
      orderInfo: `Payment for invoice ${currentOrderId.value}`
    });

    if (response && response.data) {
      momoPaymentUrl.value = response.data.payUrl;
      momoQrCode.value = response.data.qrCodeUrl;
      message.success('MoMo payment initiated successfully');

      // Open payment URL in new tab
      if (response.data.payUrl) {
        window.open(response.data.payUrl, '_blank');
      }

      // Start checking payment status
      checkMoMoPaymentStatus();
    } else {
      message.error('Failed to initiate MoMo payment');
    }
  } catch (error) {
    message.error(error.message || 'An unexpected error occurred');
    console.error('MoMo payment error:', error);
  } finally {
    momoLoading.value = false;
  }
};

const openMoMoApp = () => {
  if (momoPaymentUrl.value) {
    window.open(momoPaymentUrl.value, '_blank');
  } else {
    message.warning('No payment URL available');
  }
};

// Check MoMo payment status periodically
const checkMoMoPaymentStatus = () => {
  if (!currentOrderId.value) {
    console.error('No order ID available for status check');
    return;
  }

  momoPaymentStatus.value = 'Checking...';
  let attempts = 0;
  const maxAttempts = 60; // Check for 5 minutes max

  const checkInterval = setInterval(async () => {
    try {
      attempts++;
      console.log(`Checking MoMo payment status... Attempt ${attempts} for ${currentOrderId.value}`);

      // Call the status check API
      const response = await api.get('/api/payment/momo/status', {
        params: { orderId: currentOrderId.value }
      });

      console.log('Status check response:', response);

      if (response && response.data) {
        if (response.data.status === 'paid') {
          // Payment successful
          momoPaymentStatus.value = 'Paid';
          clearInterval(checkInterval);
          message.success('Payment successful!');

          // Invoice already marked as paid, clear cart and refresh medicine data
          clearCart();
          // Reload medicine data to reflect updated stock quantities
          fetchMedicines();
        } else if (response.data.status === 'not_found') {
          momoPaymentStatus.value = 'Checking...'; // Continue checking
          console.log('Invoice not found yet, continuing to check...');
        }
      }

      // Stop checking after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        momoPaymentStatus.value = 'Timeout';
        message.warning('Payment verification timeout. Please check manually.');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      momoPaymentStatus.value = 'Error checking status';
    }
  }, 5000); // Check every 5 seconds
};

onMounted(async () => {
  await Promise.all([
    fetchMedicines(),
    fetchCustomers(),
    fetchBankAccounts(),
    fetchEmployees(),
    fetchAvailableShifts(),
    fetchActiveShift(),
  ]);
});

// Refresh data when component is activated (navigated to)
onActivated(async () => {
  // Only refresh if we're on the POS invoice page
  if (route.path === '/invoice/pos') {
    await Promise.all([
      fetchMedicines(),
      fetchCustomers(),
      fetchBankAccounts(),
      fetchEmployees(),
      fetchAvailableShifts(),
      fetchActiveShift(),
    ]);
  }
});

// Watch route changes to refresh data
watch(() => route.path, async (newPath) => {
  if (newPath === '/invoice/pos') {
    await Promise.all([fetchMedicines(), fetchCustomers(), fetchBankAccounts()]);
  }
});
</script>