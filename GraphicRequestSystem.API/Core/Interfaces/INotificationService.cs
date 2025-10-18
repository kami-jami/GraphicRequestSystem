using GraphicRequestSystem.API.Core.Entities;

namespace GraphicRequestSystem.API.Core.Interfaces
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string userId, int requestId, string message, string type);
        Task<List<Notification>> GetUserNotificationsAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task MarkAsReadAsync(int notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
        Task SendInboxUpdateAsync(params string[] userIds);
    }
}
