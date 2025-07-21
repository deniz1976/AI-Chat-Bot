"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChatMessage } from "@/components/chat-message"
import { TypingIndicator } from "@/components/typing-indicator"
import { Send, Sparkles, MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as signalR from "@microsoft/signalr"

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
  const [isConnected, setIsConnected] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messageIdCounterRef = useRef<number>(0)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const connectionIdRef = useRef<string>("")
  const currentMessageRef = useRef<string>("")
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const generateUniqueId = (): string => {
    messageIdCounterRef.current += 1
    return `msg-${Date.now()}-${messageIdCounterRef.current}`
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, currentAssistantMessage])

  useEffect(() => {
    currentMessageRef.current = currentAssistantMessage
  }, [currentAssistantMessage])

  const completeMessage = useCallback(() => {
    const finalMessage = currentMessageRef.current.trim()
    if (finalMessage) {
      console.log("Final response:", finalMessage)
      
      const assistantMessage: Message = {
        id: generateUniqueId(),
        content: finalMessage,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      console.log("Assistant message added")
    } else {
      console.warn("Empty response received")
    }

    setCurrentAssistantMessage("")
    setIsLoading(false)
    currentMessageRef.current = ""
  }, [])

  useEffect(() => {
    let mounted = true
    
    const setupSignalR = async () => {
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        console.log("Connection already exists, skipping setup")
        return
      }

      console.log("Setting up SignalR connection...")
      
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5284/ai-hub")
        .withAutomaticReconnect()
        .build()

      newConnection.on("ReceiveMessage", (message: string) => {
        if (!mounted) return
        
        console.log("SignalR message received:", message)
        
        setCurrentAssistantMessage(prev => {
          const newMessage = prev + message
          currentMessageRef.current = newMessage
          return newMessage
        })

        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current)
        }
        
        streamTimeoutRef.current = setTimeout(() => {
          if (mounted) {
            console.log("Timeout - stream completed")
            completeMessage()
          }
        }, 3000)
      })

      newConnection.onreconnecting((error) => {
        console.log("SignalR reconnecting...", error)
        if (mounted) setIsConnected(false)
      })

      newConnection.onreconnected((connectionId) => {
        console.log("SignalR reconnected:", connectionId)
        if (mounted) {
          setIsConnected(true)
          if (connectionId) {
            connectionIdRef.current = connectionId
          }
        }
      })

      newConnection.onclose((error) => {
        console.log("SignalR connection closed:", error)
        if (mounted) setIsConnected(false)
      })

      try {
        await newConnection.start()
        if (!mounted) {
          await newConnection.stop()
          return
        }
        
        console.log("SignalR connection established. Connection ID:", newConnection.connectionId)
        connectionRef.current = newConnection
        setIsConnected(true)
        
        if (newConnection.connectionId) {
          connectionIdRef.current = newConnection.connectionId
          console.log("Connection ID updated:", newConnection.connectionId)
        }
      } catch (error) {
        console.error("SignalR connection error:", error)
        if (mounted) setIsConnected(false)
      }
    }

    setupSignalR()

    return () => {
      mounted = false
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current)
      }
      if (connectionRef.current) {
        console.log("Closing SignalR connection...")
        connectionRef.current.stop()
        connectionRef.current = null
      }
      setIsConnected(false)
    }
  }, [completeMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !isConnected || !connectionRef.current) return

    console.log("Sending message:", input)
    console.log("Connection ID:", connectionIdRef.current)

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
    currentMessageRef.current = ""

    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current)
    }

    try {
      console.log("Starting API call...")
      
      const response = await fetch("http://localhost:5284/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentInput,
          connectionId: connectionIdRef.current
        })
      })

      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("Waiting for SignalR messages...")

    } catch (error) {
      console.error("Error occurred:", error)
      setIsLoading(false)
      setCurrentAssistantMessage("")
      currentMessageRef.current = ""
      
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current)
      }
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'} - Please try again`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="h-[90vh] flex flex-col shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-0 overflow-hidden">
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
                    <p className="text-blue-100 text-sm opacity-90">
                      {`Powered by advanced AI with real-time streaming${isConnected ? " (Connected)" : " (Connecting...)"}`}
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </CardHeader>

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

            <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6">
              <form onSubmit={handleSubmit} className="flex w-full gap-3">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    disabled={isLoading || !isConnected}
                    className="pr-12 h-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim() || !isConnected}
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
