using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using GraphicRequestSystem.API.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace GraphicRequestSystem.API.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Request> Requests { get; set; }
        public DbSet<Lookup> Lookups { get; set; }
        public DbSet<LookupItem> LookupItems { get; set; }
        public DbSet<LabelRequestDetail> LabelRequestDetails { get; set; }
        public DbSet<RequestHistory> RequestHistories { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Update Seeding Logic with new names
            var requestTypeLookup = new Lookup { Id = 1, Name = "RequestTypes" };
            modelBuilder.Entity<Lookup>().HasData(requestTypeLookup);

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 1, LookupId = 1, Value = "طراحی لیبل" },
                new LookupItem { Id = 2, LookupId = 1, Value = "عکس بسته‌بندی محصولات" },
                new LookupItem { Id = 3, LookupId = 1, Value = "پست اینستاگرام" },
                new LookupItem { Id = 4, LookupId = 1, Value = "ویدئو تبلیغاتی" },
                new LookupItem { Id = 5, LookupId = 1, Value = "محتوا برای سایت" },
                new LookupItem { Id = 6, LookupId = 1, Value = "ویرایش فایل" },
                new LookupItem { Id = 7, LookupId = 1, Value = "کالای تبلیغاتی" },
                new LookupItem { Id = 8, LookupId = 1, Value = "تبلیغات بصری" },
                new LookupItem { Id = 9, LookupId = 1, Value = "تبلیغات محیطی" },
                new LookupItem { Id = 10, LookupId = 1, Value = "متفرقه" }
            );

            modelBuilder.Entity<SystemSetting>().HasData(
                // new SystemSetting { Id = 1, SettingKey = "DeadlineWarningDays", SettingValue = "2" },
                new SystemSetting { Id = 2, SettingKey = "MaxNormalRequestsPerDay", SettingValue = "5" },
                new SystemSetting { Id = 3, SettingKey = "MaxUrgentRequestsPerDay", SettingValue = "2" },
                new SystemSetting { Id = 4, SettingKey = "OrderableDaysInFuture", SettingValue = "30" }
            );
        }
    }
}
