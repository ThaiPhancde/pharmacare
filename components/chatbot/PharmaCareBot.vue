<template>
  <div class="pharmacy-chatbot">
    <!-- Floating button (collapsed state) -->
    <button v-if="!isOpen" @click="toggleChat"
      class="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center transition-transform hover:scale-110">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>

    <!-- Chat window (expanded state) -->
    <div v-if="isOpen"
      class="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-background border rounded-lg shadow-lg flex flex-col z-50">
      <!-- Header -->
      <div class="flex items-center justify-between bg-primary text-primary-foreground p-3 rounded-t-lg">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-bold">PharmaCare Assistant</h3>
            <p class="text-xs opacity-75">Online</p>
          </div>
        </div>
        <button @click="toggleChat" class="text-primary-foreground hover:text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Chat messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="chatMessages">
        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="flex flex-col space-y-3">
          <div class="bg-muted p-3 rounded-lg text-left max-w-[80%]">
            <p>Xin chào! Tôi là trợ lý PharmaCare. Tôi có thể giúp bạn tra cứu thông tin về thuốc, liều lượng, tác dụng phụ và nhiều thông tin khác. Hãy đặt câu hỏi cho tôi!</p>
          </div>
        </div>

        <!-- Chat history -->
        <template v-for="(msg, index) in messages" :key="index">
          <!-- User message -->
          <div v-if="msg.type === 'user'" class="flex justify-end">
            <div class="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
              <p>{{ msg.content }}</p>
            </div>
          </div>

          <!-- Bot message -->
          <div v-else class="flex justify-start">
            <div class="bg-muted p-3 rounded-lg max-w-[80%]">
              <p>{{ msg.content }}</p>
            </div>
          </div>
        </template>

        <!-- Loading indicator -->
        <div v-if="loading" class="flex justify-start">
          <div class="bg-muted p-3 rounded-lg flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="p-3 border-t">
        <form @submit.prevent="sendMessage" class="flex space-x-2">
          <input type="text" v-model="userInput" placeholder="Nhập câu hỏi của bạn..."
            class="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="submit" :disabled="loading || !userInput.trim()"
            class="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

// Use chat composable
const { 
  isOpen, 
  messages, 
  loading, 
  toggleChat, 
  addUserMessage, 
  addBotMessage, 
  startLoading, 
  stopLoading 
} = useChat();

// Local state for input field
const userInput = ref('');
const chatMessages = ref<HTMLElement | null>(null);

// Scroll to bottom of chat
const scrollToBottom = async () => {
  await nextTick();
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
  }
};

// Send message to API
const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;

  // Add user message to chat
  const userMessage = userInput.value.trim();
  addUserMessage(userMessage);
  userInput.value = '';
  startLoading();

  // Scroll to bottom
  await scrollToBottom();

  try {
    // Call API
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();

    // Add bot response to chat
    if (data.success && data.data?.answer) {
      addBotMessage(data.data.answer);
    } else {
      addBotMessage('Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng thử lại với câu hỏi khác.');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addBotMessage('Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.');
  } finally {
    stopLoading();
    await scrollToBottom();
  }
};

// Watch for chat opening to scroll to bottom
watch(isOpen, (newValue) => {
  if (newValue) {
    scrollToBottom();
  }
});

// Auto focus input when chat is opened
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      const input = document.querySelector('.pharmacy-chatbot input') as HTMLInputElement;
      if (input) input.focus();
    });
  }
});

// Handle Escape key to close chat
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen.value) {
      toggleChat();
    }
  });
});
</script>

<style scoped>
.pharmacy-chatbot {
  --animate-duration: 0.3s;
}

/* Custom scrollbar */
.pharmacy-chatbot ::-webkit-scrollbar {
  width: 6px;
}

.pharmacy-chatbot ::-webkit-scrollbar-track {
  background: transparent;
}

.pharmacy-chatbot ::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.pharmacy-chatbot ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style> 