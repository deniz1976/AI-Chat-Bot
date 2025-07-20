"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot } from "lucide-react"
import { motion } from "framer-motion"

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 justify-start"
    >
      <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <Bot className="w-5 h-5" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
