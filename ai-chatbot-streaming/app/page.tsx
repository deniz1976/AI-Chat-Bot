"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChatMessage } from "@/components/chat-message"
import { TypingIndicator } from "@/components/typing-indicator"
import { Send, Sparkles, MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messageIdCounterRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Benzersiz ID üret
  const generateUniqueId = (): string => {
    messageIdCounterRef.current += 1
    return `msg-${Date.now()}-${messageIdCounterRef.current}`
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, currentAssistantMessage])

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: generateUniqueId(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setCurrentAssistantMessage("")

    // Önceki stream'i iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    console.log("🚀 Mesaj gönderiliyor:", currentInput)

    try {
      // HTTP Streaming isteği
      const response = await fetch("http://localhost:5284/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentInput,
          connectionId: `session-${Date.now()}`
        }),
        signal: abortControllerRef.current.signal
      })

      console.log("📡 Backend yanıt durumu:", response.status)

      if (!response.ok) {
        throw new Error(`Backend hatası: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body yok")
      }

      // Stream reader oluştur
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      console.log("✅ Streaming başladı...")

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log("🏁 Streaming tamamlandı")
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log("📦 Chunk alındı:", chunk)
        
        fullResponse += chunk
        setCurrentAssistantMessage(fullResponse)
      }

      // Stream tamamlandığında mesajı kaydet
      if (fullResponse.trim()) {
        console.log("💾 Final mesaj kaydediliyor:", fullResponse)
        const assistantMessage: Message = {
          id: generateUniqueId(),
          content: fullResponse.trim(),
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }

      setCurrentAssistantMessage("")
      setIsLoading(false)

    } catch (error) {
      console.error("❌ Chat hatası:", error)
      setIsLoading(false)
      setCurrentAssistantMessage("")
      
      // Hata mesajı göster
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="h-[90vh] flex flex-col shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-0 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      AI Chat Assistant
                    </h1>
                    <p className="text-blue-100 text-sm opacity-90">Powered by advanced AI with real-time streaming</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </CardHeader>

            {/* Chat Area */}
            <CardContent className="flex-1 p-0 relative overflow-hidden">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-6 space-y-6">
                  <AnimatePresence>
                    {messages.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
                      >
                        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-3xl mb-6 backdrop-blur-sm">
                          <MessageCircle className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Welcome to AI Chat</h3>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                          Start a conversation with our AI assistant. Ask questions, get help, or just chat!
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))}
                        {currentAssistantMessage && (
                          <ChatMessage 
                            key="streaming-current" 
                            message={{
                              id: "streaming-current",
                              content: currentAssistantMessage,
                              role: "assistant",
                              timestamp: new Date()
                            }}
                            isStreaming={true}
                          />
                        )}
                        {isLoading && !currentAssistantMessage && <TypingIndicator />}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6">
              <form onSubmit={handleSubmit} className="flex w-full gap-3">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className="pr-12 h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white border-0 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
