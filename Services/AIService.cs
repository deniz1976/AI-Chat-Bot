using ChatBot.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.Text;

namespace ChatBot.Services
{
    public class AIService(IHubContext<AIHub> hubContext, IChatCompletionService chatCompletionService, Kernel kernel)
    {
        public async Task GetMessageStreamAsync(string prompt, string connectionId, CancellationToken cancellationToken, HttpResponse response)
        {
            OpenAIPromptExecutionSettings openAIPromptExecutionSettings = new()
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
            };

            var history = HistoryService.GetChatHistory(connectionId);
            history.AddUserMessage(prompt);
            
            string responseContent = "";
            
            try
            {
                await foreach (var chunk in chatCompletionService.GetStreamingChatMessageContentsAsync(history, executionSettings: openAIPromptExecutionSettings, kernel: kernel))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var chunkText = chunk.ToString();
                    responseContent += chunkText;

                    var bytes = Encoding.UTF8.GetBytes(chunkText);
                    await response.Body.WriteAsync(bytes, cancellationToken);
                    await response.Body.FlushAsync(cancellationToken);
                    
                    await Task.Delay(50, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Streaming error: {ex.Message}");
            }
            
            history.AddAssistantMessage(responseContent);
        }

        public async Task GetMessageStreamAsync(string prompt, string connectionId, CancellationToken? cancellationToken = default!)
        {
            Console.WriteLine($"AIService - SignalR stream starting. Prompt: {prompt}, ConnectionId: {connectionId}");
            
            OpenAIPromptExecutionSettings openAIPromptExecutionSettings = new()
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
            };

            var history = HistoryService.GetChatHistory(connectionId);
            history.AddUserMessage(prompt);
            
            string responseContent = "";
            int chunkCount = 0;
            
            try
            {
                await foreach (var response in chatCompletionService.GetStreamingChatMessageContentsAsync(history, executionSettings: openAIPromptExecutionSettings, kernel: kernel))
                {
                    cancellationToken?.ThrowIfCancellationRequested();

                    var chunk = response.ToString();
                    responseContent += chunk;
                    chunkCount++;
                    
                    Console.WriteLine($"SignalR chunk sending #{chunkCount}: {chunk}");
                    
                    try 
                    {
                        await hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", chunk, cancellationToken ?? CancellationToken.None);
                        Console.WriteLine($"Sent to specific client: {connectionId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to send to specific client: {ex.Message}");
                        Console.WriteLine($"Attempting to send to all clients as fallback...");
                        await hubContext.Clients.All.SendAsync("ReceiveMessage", chunk, cancellationToken ?? CancellationToken.None);
                    }
                    
                    await Task.Delay(100, cancellationToken ?? CancellationToken.None);
                }
                
                Console.WriteLine($"SignalR stream completed. Total chunks: {chunkCount}, Total response: {responseContent.Length} characters");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SignalR stream error: {ex.Message}");
                try
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", $"Error: {ex.Message}", CancellationToken.None);
                }
                catch
                {
                    await hubContext.Clients.All.SendAsync("ReceiveMessage", $"Error: {ex.Message}", CancellationToken.None);
                }
            }
            
            history.AddAssistantMessage(responseContent);
        }
    }
}

