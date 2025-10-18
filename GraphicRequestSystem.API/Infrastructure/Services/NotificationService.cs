using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.Hubs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task CreateNotificationAsync(string userId, int requestId, string message, string type)
        {
            var notification = new Notification
            {
                UserId = userId,
                RequestId = requestId,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.Now // Use local time
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Send real-time notification via SignalR
            await _hubContext.Clients.Group(userId).SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.RequestId,
                notification.Message,
                notification.Type,
                notification.IsRead,
                notification.CreatedAt
            });
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .Include(n => n.Request)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Limit to last 50 notifications
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        public async Task MarkAsReadAsync(int notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();

                // Update client via SignalR
                await _hubContext.Clients.Group(userId).SendAsync("NotificationRead", notificationId);
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            // Update client via SignalR
            await _hubContext.Clients.Group(userId).SendAsync("AllNotificationsRead");
        }

        public async Task SendInboxUpdateAsync(params string[] userIds)
        {
            // Send real-time inbox update notification to specified users
            var validUserIds = userIds.Where(id => !string.IsNullOrEmpty(id)).ToList();

            if (validUserIds.Count == 0)
            {
                Console.WriteLine("⚠️ SendInboxUpdateAsync called but no valid user IDs provided");
                return;
            }

            Console.WriteLine($"📬 Sending InboxUpdate to {validUserIds.Count} user(s): {string.Join(", ", validUserIds)}");

            foreach (var userId in validUserIds)
            {
                await _hubContext.Clients.Group(userId).SendAsync("InboxUpdate");
            }
        }
    }
}
