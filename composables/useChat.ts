// @ts-ignore: Bỏ qua lỗi import Vue
import { ref } from 'vue';

// Define types
type MessageType = 'user' | 'bot';

interface ChatMessage {
  type: MessageType;
  content: string;
  timestamp?: Date;
}

// Create a reactive chat state that persists between component instances
const isOpen = ref(false);
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);

export function useChat() {
  // Toggle chat open/close
  const toggleChat = () => {
    isOpen.value = !isOpen.value;
  };

  // Add a user message
  const addUserMessage = (content: string) => {
    messages.value.push({
      type: 'user',
      content,
      timestamp: new Date(),
    });
  };

  // Add a bot message
  const addBotMessage = (content: string) => {
    messages.value.push({
      type: 'bot',
      content,
      timestamp: new Date(),
    });
  };

  // Start loading state
  const startLoading = () => {
    loading.value = true;
  };

  // Stop loading state
  const stopLoading = () => {
    loading.value = false;
  };

  // Clear chat history
  const clearChat = () => {
    messages.value = [];
  };

  // Open chat window
  const openChat = () => {
    isOpen.value = true;
  };

  // Close chat window
  const closeChat = () => {
    isOpen.value = false;
  };

  return {
    // State
    isOpen,
    messages,
    loading,
    
    // Methods
    toggleChat,
    addUserMessage,
    addBotMessage,
    startLoading,
    stopLoading,
    clearChat,
    openChat,
    closeChat,
  };
} 