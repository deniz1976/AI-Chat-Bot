using Microsoft.SemanticKernel;
using OpenAI;
using System.ClientModel;


var builder = WebApplication.CreateBuilder(args);

var GeminiKey = builder.Configuration["GeminiKey"];
var GeminiModel = builder.Configuration["GeminiModelID"];

builder.Services.AddOpenAIChatCompletion(
    modelId: "",
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

builder.Services.AddSignalR();


builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
