"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"
import { motion } from "framer-motion"

interface ChatMessageProps {
  message: {
    id: string
    content: string
    role: "user" | "assistant"
    timestamp: Date
  }
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} group`}
    >
      {!isUser && (
        <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-lg">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-200 ${
          isUser
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white dark:from-blue-500 dark:to-blue-600"
            : "bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50"
        }`}
      >
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              className="inline-block w-2 h-5 bg-current ml-1"
            />
          )}
        </div>
        <div className={`text-xs mt-2 opacity-60 ${isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-lg">
          <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}
