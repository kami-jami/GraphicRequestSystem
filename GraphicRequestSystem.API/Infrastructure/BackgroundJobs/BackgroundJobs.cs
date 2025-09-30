using GraphicRequestSystem.API.Core.Enums;
using GraphicRequestSystem.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.BackgroundJobs
{
    public class DeadlineCheckerJob
    {
        private readonly AppDbContext _context;

        public DeadlineCheckerJob(AppDbContext context)
        {
            _context = context;
        }

        public async Task CheckForUpcomingDeadlines()
        {
            Console.WriteLine("Hangfire Job: در حال بررسی ددلاین‌های نزدیک...");

            var settings = await _context.SystemSettings.ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);
            var warningDays = int.Parse(settings.GetValueOrDefault("DeadlineWarningDays", "2"));
            var warningDate = DateTime.UtcNow.AddDays(warningDays);

            var upcomingRequests = await _context.Requests
                .Where(r => (r.Status == RequestStatus.DesignInProgress || r.Status == RequestStatus.PendingRedesign)
                            && r.DueDate <= warningDate)
                .ToListAsync();

            if (upcomingRequests.Any())
            {
                foreach (var request in upcomingRequests)
                {
                    Console.WriteLine($"[هشدار ددلاین] درخواست شماره: {request.Id}, عنوان: '{request.Title}' در تاریخ {request.DueDate.ToShortDateString()} تحویل داده شود!");
                }
            }
            else
            {
                Console.WriteLine("Hangfire Job: هیچ ددلاین نزدیکی یافت نشد.");
            }
        }
    }
}