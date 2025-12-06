<script setup lang="ts">
/**
 * 🏥 PharmaCare Advanced Medical AI Chatbot v3.0
 * 
 * Features:
 * - Unified Medical AI (3-in-1: Basic + Database + Medical Consultation)
 * - Multi-turn conversation với conversation stages
 * - Rich message types: text, cards, buttons, forms
 * - Medicine recommendation cards với action buttons
 * - Real-time typing indicator
 * - Session management với localStorage
 * - Auto-scroll, keyboard shortcuts
 */

// Types
interface Message {
  id: string
  sender: 'user' | 'bot'
  content: string
  timestamp: Date
  type?: 'text' | 'card' | 'buttons' | 'form'
  data?: any
  actionButtons?: ActionButton[]
}

interface ActionButton {
  label: string
  icon?: string
  action: string
  query?: string
  data?: any
  color?: string
}

interface ConversationStage {
  id: string
  label: string
  icon: string
  completed: boolean
}

// State
const isOpen = ref(false)
const activeTab = ref('chat')
const messages = ref<Message[]>([])
const userInput = ref('')
const isTyping = ref(false)
const sessionId = ref('')
const consultationStage = ref('greeting')
const chatMessages = ref<HTMLElement | null>(null)
const unreadCount = ref(0)
const showImageUpload = ref(false)

// Conversation stages visualization
const conversationStages = computed<ConversationStage[]>(() => [
  { id: 'greeting', label: 'Chào hỏi', icon: 'mdi:hand-wave', completed: ['patient_info', 'symptoms_inquiry', 'medical_history', 'analysis', 'recommendation'].includes(consultationStage.value) },
  { id: 'patient_info', label: 'Thông tin', icon: 'mdi:account', completed: ['symptoms_inquiry', 'medical_history', 'analysis', 'recommendation'].includes(consultationStage.value) },
  { id: 'symptoms_inquiry', label: 'Triệu chứng', icon: 'mdi:stethoscope', completed: ['medical_history', 'analysis', 'recommendation'].includes(consultationStage.value) },
  { id: 'medical_history', label: 'Tiền sử', icon: 'mdi:clipboard-text', completed: ['analysis', 'recommendation'].includes(consultationStage.value) },
  { id: 'analysis', label: 'Phân tích', icon: 'mdi:brain', completed: ['recommendation'].includes(consultationStage.value) },
  { id: 'recommendation', label: 'Điều trị', icon: 'mdi:pill', completed: consultationStage.value === 'completed' },
])

// Tabs
const tabs = [
  { id: 'chat', label: 'Tư vấn', icon: 'mdi:chat' },
  { id: 'search', label: 'Tìm thuốc', icon: 'mdi:magnify' },
  { id: 'help', label: 'Trợ giúp', icon: 'mdi:help-circle' },
]

// Quick filters for search tab
const quickFilters = [
  { label: 'Giảm đau', icon: 'mdi:bandage', query: 'Tìm thuốc giảm đau' },
  { label: 'Hạ sốt', icon: 'mdi:thermometer', query: 'Tìm thuốc hạ sốt' },
  { label: 'Kháng sinh', icon: 'mdi:bacteria', query: 'Tìm thuốc kháng sinh' },
  { label: 'Dị ứng', icon: 'mdi:allergy', query: 'Tìm thuốc dị ứng' },
  { label: 'Tiêu hóa', icon: 'mdi:stomach', query: 'Tìm thuốc tiêu hóa' },
  { label: 'Vitamin', icon: 'mdi:fruit-citrus', query: 'Tìm vitamin tổng hợp' },
]

// Suggested questions
const suggestedQuestions = [
  { icon: 'mdi:pill', text: 'Tôi bị sốt và đau đầu', category: 'medical' },
  { icon: 'mdi:cough', text: 'Ho có đờm màu vàng', category: 'medical' },
  { icon: 'mdi:stomach', text: 'Đau bụng và tiêu chảy', category: 'medical' },
  { icon: 'mdi:magnify', text: 'Tìm thuốc Paracetamol', category: 'search' },
  { icon: 'mdi:currency-usd', text: 'Giá thuốc hạ sốt', category: 'search' },
  { icon: 'mdi:package-variant', text: 'Kiểm tra tồn kho', category: 'search' },
]

// Initialize session
onMounted(() => {
  // Generate or retrieve sessionId
  const storedSessionId = localStorage.getItem('pharmacare_session_id')
  if (storedSessionId) {
    sessionId.value = storedSessionId
    loadChatHistory()
  }
  else {
    // Generate UUID
    sessionId.value = crypto.randomUUID()
    localStorage.setItem('pharmacare_session_id', sessionId.value)
  }

  // Welcome message
  if (messages.value.length === 0) {
    addBotMessage(
      `Xin chào! Tôi là Bác sĩ AI của PharmaCare 👋\n\nTôi có thể giúp bạn:\n✅ Tư vấn sức khỏe và đề xuất thuốc\n✅ Tìm kiếm thuốc trong kho\n✅ Kiểm tra tồn kho và giá\n✅ Giải đáp thắc mắc về thuốc\n\nBạn muốn tôi giúp gì hôm nay?`,
      'text',
      {
        actionButtons: [
          { label: 'Tư vấn bệnh', icon: 'mdi:stethoscope', action: 'medical_consultation', query: '', color: 'blue' },
          { label: 'Tìm thuốc', icon: 'mdi:magnify', action: 'search_medicine', query: '', color: 'green' },
        ],
      },
    )
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

// Functions
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    nextTick(() => {
      scrollToBottom()
      focusInput()
    })
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    toggleChat()
  }
}

function focusInput() {
  const input = document.querySelector('.chat-input') as HTMLInputElement
  if (input) {
    input.focus()
  }
}

function addBotMessage(content: string, type = 'text', data?: any) {
  const message: Message = {
    id: crypto.randomUUID(),
    sender: 'bot',
    content,
    timestamp: new Date(),
    type,
    data,
    actionButtons: data?.actionButtons || [],
  }
  messages.value.push(message)

  if (!isOpen.value) {
    unreadCount.value++
  }

  nextTick(() => scrollToBottom())
  saveChatHistory()
}

function addUserMessage(content: string) {
  const message: Message = {
    id: crypto.randomUUID(),
    sender: 'user',
    content,
    timestamp: new Date(),
    type: 'text',
  }
  messages.value.push(message)
  nextTick(() => scrollToBottom())
  saveChatHistory()
}

async function sendMessage(customMessage?: string) {
  const messageText = customMessage || userInput.value.trim()
  if (!messageText)
    return

  // Add user message
  addUserMessage(messageText)
  userInput.value = ''

  // Show typing indicator
  isTyping.value = true

  try {
    // Call unified medical AI API
    const response = await $fetch('/api/chatbot/unified-medical-ai', {
      method: 'POST',
      body: {
        message: messageText,
        sessionId: sessionId.value,
      },
    })

    isTyping.value = false

    if (response.success) {
      // Update consultation stage
      if (response.consultationStage) {
        consultationStage.value = response.consultationStage
      }

      // Add bot response
      addBotMessage(
        response.response,
        response.actionButtons?.length > 0 ? 'buttons' : 'text',
        {
          actionButtons: response.actionButtons || [],
          intent: response.intent,
          medicines: response.medicines || [],
        },
      )

      // Auto-suggest follow-up questions based on stage
      if (consultationStage.value === 'recommendation') {
        setTimeout(() => {
          addBotMessage(
            '💡 Bạn có câu hỏi gì thêm không?',
            'buttons',
            {
              actionButtons: [
                { label: 'Hỏi thêm về thuốc', action: 'ask_more', query: 'Cho tôi biết thêm về thuốc này', color: 'blue' },
                { label: 'Đặt mua thuốc', action: 'order', query: '', color: 'green' },
                { label: 'Hẹn tái khám', action: 'follow_up', query: '', color: 'purple' },
                { label: 'Kết thúc', action: 'end', query: 'Cảm ơn bác sĩ', color: 'gray' },
              ],
            },
          )
        }, 1000)
      }
    }
    else {
      addBotMessage(`❌ Xin lỗi, có lỗi xảy ra: ${response.message}`)
    }
  }
  catch (error: any) {
    isTyping.value = false
    addBotMessage(`❌ Không thể kết nối đến server. Vui lòng thử lại sau.\n\nLỗi: ${error.message}`)
  }
}

function handleActionButton(button: ActionButton) {
  if (button.action === 'medical_consultation') {
    activeTab.value = 'chat'
    sendMessage('Tôi muốn tư vấn về sức khỏe')
  }
  else if (button.action === 'search_medicine') {
    activeTab.value = 'search'
  }
  else if (button.action === 'order') {
    addBotMessage('📦 Để đặt mua thuốc, vui lòng:\n\n1. Nhấn vào nút "Mua Ngay" trên thẻ thuốc\n2. Hoặc liên hệ hotline: 1900-xxxx\n3. Hoặc ghé trực tiếp nhà thuốc PharmaCare')
  }
  else if (button.action === 'follow_up') {
    addBotMessage('📅 Tái khám sau 3-5 ngày nếu:\n\n✅ Triệu chứng không cải thiện\n✅ Xuất hiện tác dụng phụ\n✅ Có thắc mắc về thuốc\n\nBạn muốn đặt lịch hẹn tái khám không?', 'buttons', {
      actionButtons: [
        { label: 'Đặt lịch ngay', action: 'schedule', query: '', color: 'green' },
        { label: 'Để sau', action: 'later', query: '', color: 'gray' },
      ],
    })
  }
  else if (button.action === 'end') {
    sendMessage(button.query || 'Cảm ơn bác sĩ')
    setTimeout(() => {
      addBotMessage('🌟 Rất vui được hỗ trợ bạn!\n\nChúc bạn sớm khỏe mạnh. Nếu cần hỗ trợ thêm, hãy quay lại bất cứ lúc nào nhé! 💊')
      consultationStage.value = 'completed'
    }, 500)
  }
  else if (button.query) {
    sendMessage(button.query)
  }
}

function handleQuickFilter(filter: any) {
  // Auto-switch to chat tab and send query immediately
  activeTab.value = 'chat'
  nextTick(() => {
    sendMessage(filter.query)
  })
}

function handleSuggestedQuestion(question: any) {
  // Auto-switch to chat tab for any question
  activeTab.value = 'chat'
  nextTick(() => {
    sendMessage(question.text)
  })
}

function scrollToBottom() {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight
  }
}

/**
 * Handle image upload success
 */
function handleImageUploadSuccess(data: any) {
  showImageUpload.value = false

  // Add user message with image
  addUserMessage(`[Đã gửi ảnh thuốc: ${data.recognized.medicineName || 'Không nhận diện được'}]`)

  // Prepare bot response
  let responseText = '📸 Kết quả phân tích ảnh:\n\n'

  // Recognition result
  if (data.recognized.confidence >= 70) {
    responseText += `✅ Nhận diện: ${data.recognized.medicineName}`
    if (data.recognized.brandName) {
      responseText += ` (${data.recognized.brandName})`
    }
    responseText += `\n🎯 Độ chính xác: ${data.recognized.confidence}%\n\n`

    if (data.recognized.ingredients) {
      responseText += `💊 Thành phần: ${data.recognized.ingredients}\n`
    }
    if (data.recognized.dosageForm) {
      responseText += `📦 Dạng bào chế: ${data.recognized.dosageForm}\n`
    }
    if (data.recognized.manufacturer) {
      responseText += `🏭 Nhà sản xuất: ${data.recognized.manufacturer}\n`
    }
  }
  else {
    responseText += `⚠️ Độ chính xác thấp (${data.recognized.confidence}%)\n`
    responseText += `Tên thuốc có thể là: ${data.recognized.medicineName || 'Không xác định'}\n\n`
    responseText += `💡 Tip: Chọn ảnh rõ nét hơn hoặc nhập tên thuốc để tìm kiếm chính xác.\n`
  }

  // Database match result
  responseText += '\n📦 Kiểm tra kho:\n'
  if (data.databaseMatch.found && data.databaseMatch.medicines.length > 0) {
    const medicine = data.databaseMatch.medicines[0]
    responseText += `\n✅ Tìm thấy trong kho!\n`
    responseText += `📌 Tên: ${medicine.name}\n`
    responseText += `💰 Giá: ${formatCurrency(medicine.price)}\n`
    responseText += `📊 Tồn kho: ${medicine.stock?.quantity || 0} ${medicine.unit}\n`

    if (medicine.stock?.expiryStatus === 'expired') {
      responseText += `⚠️ Cảnh báo: Thuốc đã HẾT HẠN (${formatDate(medicine.stock.expiryDate)})\n`
    }
    else if (medicine.stock?.expiryStatus === 'expiring_soon') {
      responseText += `⏰ Gần hết hạn: ${medicine.stock.daysUntilExpiry} ngày (${formatDate(medicine.stock.expiryDate)})\n`
    }

    // Add action buttons
    const actionButtons: ActionButton[] = [
      {
        label: 'Xem chi tiết',
        icon: 'mdi:information',
        action: 'view_detail',
        data: { medicineId: medicine._id },
        color: 'blue',
      },
      {
        label: 'Hỏi cách dùng',
        icon: 'mdi:help-circle',
        action: 'ask_usage',
        query: `Cho tôi biết cách dùng thuốc ${medicine.name}`,
        color: 'green',
      },
    ]

    if ((medicine.stock?.quantity || 0) > 0 && medicine.stock?.expiryStatus !== 'expired') {
      actionButtons.push({
        label: 'Đặt mua',
        icon: 'mdi:cart',
        action: 'order',
        data: { medicineId: medicine._id },
        color: 'amber',
      })
    }

    addBotMessage(responseText, 'buttons', { actionButtons })
  }
  else {
    responseText += '\n❌ Không tìm thấy trong kho.\n'
    responseText += '💡 Bạn có thể:\n'
    responseText += '- Nhập tên thuốc chính xác để tìm\n'
    responseText += '- Liên hệ để đặt hàng\n'

    addBotMessage(responseText, 'buttons', {
      actionButtons: [
        {
          label: 'Tìm thuốc tương tự',
          icon: 'mdi:magnify',
          action: 'search_similar',
          query: `Tìm thuốc có thành phần ${data.recognized.ingredients || data.recognized.medicineName}`,
          color: 'blue',
        },
        {
          label: 'Liên hệ đặt hàng',
          icon: 'mdi:phone',
          action: 'contact',
          query: '',
          color: 'green',
        },
      ],
    })
  }
}

/**
 * Handle image upload error
 */
function handleImageUploadError(error: string) {
  showImageUpload.value = false
  addBotMessage(`❌ Lỗi upload ảnh: ${error}\n\nVui lòng thử lại hoặc nhập tên thuốc để tìm kiếm.`)
}

/**
 * Toggle image upload modal
 */
function toggleImageUpload() {
  showImageUpload.value = !showImageUpload.value
}

/**
 * Format currency VND
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format date Vietnamese
 */
function formatDateVN(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

function saveChatHistory() {
  const history = {
    messages: messages.value,
    consultationStage: consultationStage.value,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(`pharmacare_chat_history_${sessionId.value}`, JSON.stringify(history))
}

function loadChatHistory() {
  const saved = localStorage.getItem(`pharmacare_chat_history_${sessionId.value}`)
  if (saved) {
    try {
      const history = JSON.parse(saved)
      // Only load recent history (within 7 days)
      const savedTime = new Date(history.timestamp)
      const now = new Date()
      const diffDays = (now.getTime() - savedTime.getTime()) / (1000 * 3600 * 24)

      if (diffDays <= 7) {
        messages.value = history.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        consultationStage.value = history.consultationStage || 'greeting'
      }
    }
    catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }
}

function clearChat() {
  // Show custom confirmation dialog instead of browser confirm()
  // eslint-disable-next-line no-alert
  const shouldClear = window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')
  if (shouldClear) {
    messages.value = []
    consultationStage.value = 'greeting'
    localStorage.removeItem(`pharmacare_chat_history_${sessionId.value}`)

    // New session
    sessionId.value = crypto.randomUUID()
    localStorage.setItem('pharmacare_session_id', sessionId.value)

    // Welcome message
    addBotMessage(
      `Xin chào! Tôi là Bác sĩ AI của PharmaCare 👋\n\nBạn muốn tôi giúp gì hôm nay?`,
      'text',
      {
        actionButtons: [
          { label: 'Tư vấn bệnh', icon: 'mdi:stethoscope', action: 'medical_consultation', query: '', color: 'blue' },
          { label: 'Tìm thuốc', icon: 'mdi:magnify', action: 'search_medicine', query: '', color: 'green' },
        ],
      },
    )
  }
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  const today = new Date()
  const messageDate = new Date(date)

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Hôm nay'
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua'
  }

  return messageDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Group messages by date
const groupedMessages = computed(() => {
  const groups: Record<string, Message[]> = {}

  messages.value.forEach((msg) => {
    const date = new Date(msg.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(msg)
  })

  return groups
})
</script>

<template>
  <div class="pharmacy-advanced-chatbot">
    <!-- Floating button -->
    <button
      v-if="!isOpen"
      class="chat-pulse fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-blue-700"
      @click="toggleChat"
    >
      <Icon name="mdi:chat" class="h-7 w-7" />
      <span
        v-if="unreadCount > 0"
        class="absolute h-6 w-6 flex animate-bounce items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold -right-2 -top-2"
      >
        {{ unreadCount }}
      </span>
    </button>

    <!-- Chat window -->
    <Transition name="slide-fade">
      <div
        v-if="isOpen"
        class="fixed bottom-6 right-6 z-50 max-w-[95vw] w-[420px] flex flex-col overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-2xl"
        style="height: 700px; max-height: 90vh"
      >
        <!-- Header -->
        <div class="flex items-center justify-between from-blue-600 to-blue-700 bg-gradient-to-r p-4 text-white">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="h-12 w-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Icon name="mdi:robot" class="h-7 w-7" />
              </div>
              <div class="absolute bottom-0 right-0 h-3 w-3 border-2 border-white rounded-full bg-green-400" />
            </div>
            <div>
              <h3 class="text-lg font-bold">
                Bác Sĩ AI
              </h3>
              <p class="text-xs text-blue-100">
                PharmaCare Medical Assistant
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg p-2 transition-colors hover:bg-white/10"
              title="Xóa lịch sử"
              @click="clearChat"
            >
              <Icon name="mdi:refresh" class="h-5 w-5" />
            </button>
            <button
              class="rounded-lg p-2 transition-colors hover:bg-white/10"
              @click="toggleChat"
            >
              <Icon name="mdi:close" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Consultation Progress (only show in medical consultation) -->
        <div
          v-if="consultationStage !== 'greeting' && consultationStage !== 'completed'"
          class="border-b border-blue-100 bg-blue-50 px-4 py-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-blue-900 font-medium">Tiến trình tư vấn</span>
            <span class="text-xs text-blue-600">
              {{ conversationStages.filter(s => s.completed).length }}/{{ conversationStages.length }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <div
              v-for="stage in conversationStages"
              :key="stage.id"
              class="h-1.5 flex-1 rounded-full transition-colors"
              :class="stage.completed ? 'bg-blue-600' : 'bg-blue-200'"
              :title="stage.label"
            />
          </div>
          <div class="mt-2 flex items-center gap-2 text-xs text-blue-700">
            <Icon :name="conversationStages.find(s => s.id === consultationStage)?.icon || 'mdi:check'" class="h-4 w-4" />
            <span>{{ conversationStages.find(s => s.id === consultationStage)?.label }}</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200 bg-gray-50">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
            :class="activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'"
            @click="activeTab = tab.id"
          >
            <Icon :name="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Chat Tab -->
        <div v-show="activeTab === 'chat'" class="flex flex-1 flex-col overflow-hidden">
          <!-- Messages -->
          <div ref="chatMessages" class="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            <template v-for="(dateGroup, date) in groupedMessages" :key="date">
              <!-- Date separator -->
              <div class="my-4 text-center">
                <span class="border border-gray-200 rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-sm">
                  {{ formatDate(new Date(date)) }}
                </span>
              </div>

              <!-- Messages in this date -->
              <template v-for="msg in dateGroup" :key="msg.id">
                <!-- User message -->
                <div v-if="msg.sender === 'user'" class="flex animate-slide-in-right justify-end">
                  <div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 p-3 text-white shadow-md">
                    <p class="text-sm">
                      {{ msg.content }}
                    </p>
                    <span class="mt-1 block text-xs opacity-75">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                </div>

                <!-- Bot message -->
                <div v-else class="flex animate-slide-in-left justify-start">
                  <div class="max-w-[85%] border border-gray-100 rounded-2xl rounded-tl-sm bg-white p-3 shadow-md">
                    <div class="mb-2 flex items-center gap-2">
                      <div class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100">
                        <Icon name="mdi:robot" class="h-4 w-4 text-blue-600" />
                      </div>
                      <span class="text-xs text-gray-700 font-medium">Bác sĩ AI</span>
                    </div>
                    <div class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {{ msg.content }}
                    </div>

                    <!-- Action Buttons -->
                    <div v-if="msg.actionButtons && msg.actionButtons.length > 0" class="mt-3 flex flex-wrap gap-2">
                      <button
                        v-for="(btn, idx) in msg.actionButtons"
                        :key="idx"
                        class="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium shadow-sm transition-all hover:scale-105"
                        :class="{
                          'bg-blue-600 text-white hover:bg-blue-700': btn.color === 'blue',
                          'bg-green-600 text-white hover:bg-green-700': btn.color === 'green',
                          'bg-purple-600 text-white hover:bg-purple-700': btn.color === 'purple',
                          'bg-gray-600 text-white hover:bg-gray-700': btn.color === 'gray',
                          'bg-amber-600 text-white hover:bg-amber-700': btn.color === 'amber',
                        }"
                        @click="handleActionButton(btn)"
                      >
                        <Icon v-if="btn.icon" :name="btn.icon" class="h-4 w-4" />
                        {{ btn.label }}
                      </button>
                    </div>

                    <span class="mt-2 block text-xs text-gray-500">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                </div>
              </template>
            </template>

            <!-- Typing indicator -->
            <div v-if="isTyping" class="flex animate-slide-in-left justify-start">
              <div class="border border-gray-100 rounded-2xl rounded-tl-sm bg-white p-3 shadow-md">
                <div class="flex items-center gap-2">
                  <div class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100">
                    <Icon name="mdi:robot" class="h-4 w-4 text-blue-600" />
                  </div>
                  <div class="flex gap-1">
                    <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0ms" />
                    <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 150ms" />
                    <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 300ms" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="border-t border-gray-200 bg-white p-4">
            <!-- Image Upload Modal -->
            <div v-if="showImageUpload" class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-sm text-blue-900 font-medium">
                  📤 Tải ảnh thuốc lên để nhận diện
                </h4>
                <button
                  class="text-blue-600 hover:text-blue-800"
                  @click="toggleImageUpload"
                >
                  <Icon name="mdi:close" class="h-5 w-5" />
                </button>
              </div>
              <ChatbotMedicineImageUpload
                :session-id="sessionId"
                @upload-success="handleImageUploadSuccess"
                @upload-error="handleImageUploadError"
              />
            </div>

            <div class="flex gap-2">
              <!-- Image Upload Button -->
              <button
                class="rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-600 transition-colors hover:bg-gray-50"
                title="Tải ảnh thuốc lên"
                @click="toggleImageUpload"
              >
                <Icon name="mdi:image-plus" class="h-5 w-5" />
              </button>

              <input
                v-model="userInput"
                type="text"
                placeholder="Nhập tin nhắn..."
                class="chat-input flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                @keypress.enter="sendMessage()"
              >
              <button
                class="rounded-xl bg-blue-600 px-4 py-3 text-white transition-colors disabled:cursor-not-allowed hover:bg-blue-700 disabled:opacity-50"
                :disabled="!userInput.trim() || isTyping"
                @click="sendMessage()"
              >
                <Icon name="mdi:send" class="h-5 w-5" />
              </button>
            </div>
            <p class="mt-2 text-center text-xs text-gray-500">
              Nhấn <kbd class="border border-gray-300 rounded bg-gray-100 px-2 py-0.5">Enter</kbd> để gửi
            </p>
          </div>
        </div>

        <!-- Search Tab -->
        <div v-show="activeTab === 'search'" class="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div class="space-y-4">
            <div>
              <h4 class="mb-3 flex items-center gap-2 text-sm text-gray-900 font-semibold">
                <Icon name="mdi:filter" class="h-4 w-4" />
                Tìm nhanh theo loại
              </h4>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="filter in quickFilters"
                  :key="filter.label"
                  class="border border-gray-200 rounded-lg bg-white p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
                  @click="handleQuickFilter(filter)"
                >
                  <Icon :name="filter.icon" class="mb-1 h-5 w-5 text-blue-600" />
                  <p class="text-xs text-gray-900 font-medium">
                    {{ filter.label }}
                  </p>
                </button>
              </div>
            </div>

            <div>
              <h4 class="mb-3 flex items-center gap-2 text-sm text-gray-900 font-semibold">
                <Icon name="mdi:star" class="h-4 w-4" />
                Câu hỏi gợi ý
              </h4>
              <div class="space-y-2">
                <button
                  v-for="(question, idx) in suggestedQuestions"
                  :key="idx"
                  class="w-full flex items-start gap-2 border border-gray-200 rounded-lg bg-white p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
                  @click="handleSuggestedQuestion(question)"
                >
                  <Icon :name="question.icon" class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span class="text-sm text-gray-700">{{ question.text }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Help Tab -->
        <div v-show="activeTab === 'help'" class="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          <div class="border border-gray-200 rounded-lg bg-white p-4">
            <h4 class="mb-3 flex items-center gap-2 text-gray-900 font-semibold">
              <Icon name="mdi:help-circle" class="h-5 w-5 text-blue-600" />
              Hướng dẫn sử dụng
            </h4>
            <div class="text-sm text-gray-700 space-y-3">
              <div>
                <h5 class="mb-1 text-gray-900 font-medium">
                  1. Tư vấn sức khỏe
                </h5>
                <p class="text-xs">
                  Mô tả triệu chứng của bạn (sốt, đau đầu, ho...). Bác sĩ AI sẽ hỏi chi tiết và đề xuất phác đồ điều trị.
                </p>
              </div>
              <div>
                <h5 class="mb-1 text-gray-900 font-medium">
                  2. Tìm thuốc
                </h5>
                <p class="text-xs">
                  Sử dụng tab "Tìm thuốc" hoặc gõ "Tìm thuốc [tên thuốc]" để tra cứu thông tin, giá cả, tồn kho.
                </p>
              </div>
              <div>
                <h5 class="mb-1 text-gray-900 font-medium">
                  3. Quy trình tư vấn
                </h5>
                <p class="text-xs">
                  Chào hỏi → Thông tin cá nhân → Triệu chứng → Tiền sử bệnh → Phân tích → Đề xuất điều trị
                </p>
              </div>
              <div>
                <h5 class="mb-1 text-gray-900 font-medium">
                  4. Lưu ý quan trọng
                </h5>
                <p class="text-xs text-amber-600">
                  ⚠️ Đây chỉ là tư vấn sơ bộ. Với triệu chứng nặng, hãy đến bệnh viện ngay!
                </p>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg bg-white p-4">
            <h4 class="mb-3 flex items-center gap-2 text-gray-900 font-semibold">
              <Icon name="mdi:phone" class="h-5 w-5 text-green-600" />
              Liên hệ hỗ trợ
            </h4>
            <div class="text-sm space-y-2">
              <p><strong>Hotline:</strong> 1900-xxxx</p>
              <p><strong>Email:</strong> support@pharmacare.vn</p>
              <p><strong>Giờ làm việc:</strong> 24/7</p>
            </div>
          </div>

          <div class="border border-blue-200 rounded-lg from-blue-50 to-blue-100 bg-gradient-to-r p-4">
            <p class="text-center text-xs text-blue-900">
              🌟 <strong>PharmaCare AI v3.0</strong><br>
              Powered by Gemini 2.0 Flash Experimental
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-out;
}

.chat-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.2);
  }
}

/* Transition */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Keyboard shortcut */
kbd {
  font-family: monospace;
  font-size: 0.75rem;
}
</style>
