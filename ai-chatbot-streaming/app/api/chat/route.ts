import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Streaming yanıtlar için maksimum 30 saniye süre
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    system:
      "Sen yardımsever bir AI asistanısın. Türkçe olarak yanıt ver ve kullanıcılara her konuda yardımcı olmaya çalış.",
    messages,
  })

  return result.toDataStreamResponse()
}
