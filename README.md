# 🤖 AI ChatBot - Real-Time Streaming Chat Application

A modern, real-time AI chat application. Developed with .NET 9.0 backend and Next.js 15 frontend.

![AI ChatBot Screenshot](screenshots/Gemini%20Chat%20Bot.png)
*Modern and responsive chat interface with real-time AI streaming*

## 🚀 Features

### 🎯 Core Features
- **Real-Time Streaming**: Instant AI responses with HTTP streaming
- **Modern UI/UX**: Responsive design, dark/light theme support
- **Session Management**: User-based chat history
- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error management
- **CORS Support**: Frontend-backend integration

### 🧠 AI Features
- **Google Gemini 2.0 Flash** model
- **Microsoft Semantic Kernel** integration
- **OpenRouter.ai** proxy support
- **Function Calling** capabilities
- **Chat History** management

### 🎨 UI Components
- **Shadcn/ui** component library
- **Radix UI** primitive components
- **Framer Motion** animations
- **Tailwind CSS** styling
- **Responsive Design** (mobile-friendly)

## 🏗️ Technology Stack

### Backend (.NET 9.0)
```
🔧 Framework: .NET 9.0 Web API
🧠 AI: Microsoft Semantic Kernel 1.60.0
🌐 API: OpenRouter.ai + Google Gemini 2.0 Flash
📡 Streaming: HTTP Response Streaming
🔄 SignalR: Real-time communication support
📋 OpenAPI: API documentation
```

### Frontend (Next.js 15)
```
⚛️  Framework: Next.js 15.2.4 + React 19
📝 Language: TypeScript 5
🎨 Styling: Tailwind CSS 3.4.17
🧩 Components: Shadcn/ui + Radix UI
✨ Animation: Framer Motion
🌙 Theming: next-themes
📱 Responsive: Mobile-first design
```

## 📁 Project Structure

```
ChatBot/
├── 🖥️  Backend (.NET 9.0)
│   ├── Services/
│   │   ├── AIService.cs          # AI streaming service
│   │   └── HistoryService.cs     # Chat history management
│   ├── ViewModels/
│   │   └── ChatRequestVM.cs      # Request/response models
│   ├── Hubs/
│   │   └── AIHub.cs              # SignalR hub
│   ├── Program.cs                # App configuration
│   ├── ChatBot.csproj           # Project dependencies
│   └── appsettings.json         # App settings
│
├── 🌐 Frontend (Next.js 15)
│   ├── app/
│   │   ├── api/chat/route.ts    # API route (not used)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main chat page
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── chat-message.tsx     # Chat message component
│   │   ├── typing-indicator.tsx # Loading indicator
│   │   └── theme-toggle.tsx     # Theme switcher
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   └── package.json             # Dependencies
│
└── 📄 Documentation
    ├── README.md                # This file
    └── .gitignore              # Git ignore rules
```

## 🚀 Installation and Setup

### 📋 Requirements

#### Backend
- **.NET 9.0 SDK** or higher
- **Visual Studio 2022** or **VS Code**

#### Frontend
- **Node.js 18+** 
- **NPM** or **PNPM**

### ⚙️ Installation Steps

#### 1️⃣ Clone the Repository
```bash
git clone <repository-url>
cd ChatBot
```

#### 2️⃣ Backend Setup
```bash
cd ChatBot

dotnet restore

dotnet run
```

Backend will run at **http://localhost:5284**.

#### 3️⃣ Frontend Setup
```bash
cd ai-chatbot-streaming

npm install --legacy-peer-deps

npm run dev
```

Frontend will run at **http://localhost:3000**.

## 🔧 Configuration

### Backend Settings (`appsettings.json`)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "GeminiKey": "your-openrouter-api-key",
  "GeminiModelID": "google/gemini-2.0-flash-exp:free"
}
```

### Security Warning ⚠️
**Secure your API key:**

1. Use **Environment Variables**:
```bash
set GEMINI_KEY=your-api-key
set GEMINI_MODEL_ID=google/gemini-2.0-flash-exp:free
```

2. Use **User Secrets**:
```bash
dotnet user-secrets set "GeminiKey" "your-api-key"
dotnet user-secrets set "GeminiModelID" "google/gemini-2.0-flash-exp:free"
```

## 📡 API Endpoints

### Backend Endpoints

#### `POST /chat`
Starts a chat with AI and returns streaming response.

**Request:**
```json
{
  "prompt": "Hello!",
  "connectionId": "session-12345"
}
```

**Response:**
```
Content-Type: text/plain; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive

[Streaming AI response chunks...]
```

#### `GET /ai-hub`
SignalR Hub endpoint (optional).

## 🎮 Usage

### 💬 Chat Usage

1. **Open in browser**: http://localhost:3000
2. **Type message**: Enter your message in the input field at the bottom
3. **Send**: Click the Send button or press Enter
4. **Streaming response**: AI response appears in real-time
5. **History**: All chat history is preserved

### 🎨 Theme Switching

You can switch between dark/light mode using the **theme toggle** button in the top right corner.

### 📱 Mobile Usage

The application has a fully responsive design and works perfectly on mobile devices.

## 🔍 Feature Details

### 🚀 HTTP Streaming

Frontend receives AI responses from backend in real-time:

```typescript
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  setCurrentAssistantMessage(prev => prev + chunk)
}
```

### 🧠 AI Service

AI operations in the backend are managed by the `AIService` class:

```csharp
await foreach (var chunk in chatCompletionService.GetStreamingChatMessageContentsAsync(...))
{
    var bytes = Encoding.UTF8.GetBytes(chunk.ToString());
    await response.Body.WriteAsync(bytes, cancellationToken);
    await response.Body.FlushAsync(cancellationToken);
}
```

### 💾 Session Management

Separate chat history for each user:

```csharp
public static ChatHistory GetChatHistory(string connectionId)
{
    if (_chatHistories.TryGetValue(connectionId, out chatHistory))
        return chatHistory;
    
    chatHistory = new();
    _chatHistories.Add(connectionId, chatHistory);
    return chatHistory;
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
netstat -an | findstr :5284

dotnet run --urls "http://localhost:5285"
```

#### 2. Frontend Connection Error
```typescript
const response = await fetch("http://localhost:5284/chat", ...)
```

#### 3. Dependency Issues
```bash
npm install --legacy-peer-deps --force

dotnet clean && dotnet restore
```

#### 4. CORS Errors
CORS is already enabled in the backend, but if you experience issues:
```csharp
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()
        .SetIsOriginAllowed(s => true)));
```

## 📈 Performance Tips

### Backend Optimization
- Use **Connection pooling**
- Add **Caching**
- Implement **Rate limiting**

### Frontend Optimization
- Use **Memoization**
- Implement **Lazy loading**
- Optimize **Bundle size**

## 🔮 Future Plans

- [ ] **Authentication** system
- [ ] **File upload** support
- [ ] **Multi-language** support
- [ ] **Voice chat** feature
- [ ] **Chat export** function
- [ ] **Admin dashboard**
- [ ] **Analytics** integration

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Microsoft Semantic Kernel** team
- **OpenRouter.ai** platform
- **Shadcn/ui** community
- **Next.js** and **React** teams

## 📞 Contact

- **GitHub Issues**: Report bugs and suggestions
- **Pull Requests**: Submit your contributions

---
