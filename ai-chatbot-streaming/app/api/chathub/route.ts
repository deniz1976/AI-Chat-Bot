import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// This would typically be a SignalR hub, but for demo purposes we'll use a regular API
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    const result = streamText({
      model: openai("gpt-4o"),
      system: "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
      messages: [{ role: "user", content: message }],
    })

    // In a real SignalR implementation, you would stream chunks through the hub
    const response = await result.text

    return NextResponse.json({
      success: true,
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ success: false, error: "Failed to process message" }, { status: 500 })
  }
}
