"use client"

import * as signalR from "@microsoft/signalr"

export class ChatSignalRService {
  private connection: signalR.HubConnection | null = null

  async startConnection(): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder().withUrl("/api/chathub").withAutomaticReconnect().build()

    try {
      await this.connection.start()
      console.log("SignalR Connected")
    } catch (err) {
      console.error("SignalR Connection Error: ", err)
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.invoke("SendMessage", message)
      } catch (err) {
        console.error("Error sending message: ", err)
      }
    }
  }

  onReceiveMessage(callback: (message: string) => void): void {
    if (this.connection) {
      this.connection.on("ReceiveMessage", callback)
    }
  }

  onReceiveStreamingMessage(callback: (chunk: string) => void): void {
    if (this.connection) {
      this.connection.on("ReceiveStreamingMessage", callback)
    }
  }

  onMessageComplete(callback: () => void): void {
    if (this.connection) {
      this.connection.on("MessageComplete", callback)
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
    }
  }
}
