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
            OpenAIPromptExecutionSettings openAIPromptExecutionSettings = new()
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
            };

            var history = HistoryService.GetChatHistory(connectionId);

            history.AddUserMessage(prompt);
            string responseContent = "";
            try
            {
                await foreach (var response in chatCompletionService.GetStreamingChatMessageContentsAsync(history, executionSettings: openAIPromptExecutionSettings, kernel: kernel))
                {
                    cancellationToken?.ThrowIfCancellationRequested();

                    await hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", response.ToString());
                    responseContent += response.ToString();
                }
            }
            catch (Exception)
            {

            }
            history.AddAssistantMessage(responseContent);
        }
    }
}

