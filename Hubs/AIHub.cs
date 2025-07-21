using Microsoft.AspNetCore.SignalR;

namespace ChatBot.Hubs
{
    public class AIHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"SignalR client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"SignalR client disconnected: {Context.ConnectionId}");
            if (exception != null)
            {
                Console.WriteLine($"Connection error: {exception.Message}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string message)
        {
            Console.WriteLine($"Message received in hub: {message} (ConnectionId: {Context.ConnectionId})");
            await Clients.Caller.SendAsync("ReceiveMessage", $"Echo: {message}");
        }
    }
}
