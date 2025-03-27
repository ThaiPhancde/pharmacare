import { reactive, computed } from "vue"

export type MessageType = "success" | "error" | "warning" | "info"

interface Message {
  id: number
  type: MessageType
  text: string
}

const state = reactive<{ messages: Message[] }>({ messages: [] })

export function useMessage() {
  const messages = computed(() => state.messages) // ✅ Luôn reactive

  const addMessage = (type: MessageType, text: string) => {
    const id = Date.now()
    state.messages.push({ id, type, text })

    setTimeout(() => removeMessage(id), 3000)
  }

  const removeMessage = (id: number) => {
    state.messages = state.messages.filter((msg) => msg.id !== id)
  }

  return {
    messages,
    success: (text: string) => addMessage("success", text),
    error: (text: string) => addMessage("error", text),
    warning: (text: string) => addMessage("warning", text),
    info: (text: string) => addMessage("info", text),
    removeMessage,
  }
}