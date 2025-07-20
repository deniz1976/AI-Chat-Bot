using ChatBot.Services;
using ChatBot.ViewModels;
using Microsoft.SemanticKernel;
using OpenAI;
using System.ClientModel;

var builder = WebApplication.CreateBuilder(args);

var GeminiKey = builder.Configuration["GeminiKey"];
var GeminiModel = builder.Configuration["GeminiModelID"];

builder.Services
    .AddKernel()
    .AddOpenAIChatCompletion(
    modelId: GeminiModel,
    openAIClient: new OpenAIClient(
        credential: new ApiKeyCredential(GeminiKey),
        options: new OpenAIClientOptions
        {
            Endpoint = new Uri("https://openrouter.ai/api/v1")
        })
    );

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.AllowAnyMethod()
                                       .AllowAnyHeader()
                                       .AllowCredentials()
                                       .SetIsOriginAllowed(s => true)));

builder.Services.AddHttpClient();
builder.Services.AddSignalR();
builder.Services.AddSingleton<AIService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

//app.MapPost("/chat", async (AIService aiService, ChatRequestVM chatRequest, CancellationToken cancellationToken, HttpContext context) =>
//{
//    context.Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
//    context.Response.Headers["Cache-Control"] = "no-cache";
//    context.Response.Headers["Connection"] = "keep-alive";

//    await aiService.GetMessageStreamAsync(chatRequest.Prompt, chatRequest.ConnectionId, cancellationToken, context.Response);
//});

app.MapPost("/chat", async (AIService aiService, ChatRequestVM chatRequest, CancellationToken cancellationToken)
    => await aiService.GetMessageStreamAsync(chatRequest.Prompt, chatRequest.ConnectionId, cancellationToken));

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHub<ChatBot.Hubs.AIHub>("ai-hub");


app.Run();
