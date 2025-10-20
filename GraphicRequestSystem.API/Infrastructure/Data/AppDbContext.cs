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
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<PackagingPhotoDetail> PackagingPhotoDetails { get; set; }
        public DbSet<InstagramPostDetail> InstagramPostDetails { get; set; }
        public DbSet<PromotionalVideoDetail> PromotionalVideoDetails { get; set; }
        public DbSet<WebsiteContentDetail> WebsiteContentDetails { get; set; }
        public DbSet<FileEditDetail> FileEditDetails { get; set; }
        public DbSet<PromotionalItemDetail> PromotionalItemDetails { get; set; }
        public DbSet<VisualAdDetail> VisualAdDetails { get; set; }
        public DbSet<EnvironmentalAdDetail> EnvironmentalAdDetails { get; set; }
        public DbSet<MiscellaneousDetail> MiscellaneousDetails { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<InboxView> InboxViews { get; set; }
        public DbSet<RequestView> RequestViews { get; set; }
        public DbSet<DesignerNote> DesignerNotes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Request>()
            .HasOne(r => r.Requester)
            .WithMany()
            .HasForeignKey(r => r.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Request>()
               .HasOne(r => r.Designer)
               .WithMany()
               .HasForeignKey(r => r.DesignerId)
               .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Request>()
                .HasOne(r => r.Approver)
                .WithMany()
                .HasForeignKey(r => r.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RequestHistory>()
                .HasOne(h => h.Actor)
                .WithMany()
                .HasForeignKey(h => h.ActorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Request)
                .WithMany()
                .HasForeignKey(n => n.RequestId)
                .OnDelete(DeleteBehavior.Restrict);

            // Update Seeding Logic with new names
            var requestTypeLookup = new Lookup { Id = 1, Name = "RequestTypes" };
            var labelTypeLookup = new Lookup { Id = 2, Name = "LabelTypes" };
            var measurementUnitLookup = new Lookup { Id = 3, Name = "MeasurementUnits" };
            var visualAdTypeLookup = new Lookup { Id = 4, Name = "VisualAdTypes" };
            var envAdTypeLookup = new Lookup { Id = 5, Name = "EnvironmentalAdTypes" };
            var webContentTypeLookup = new Lookup { Id = 6, Name = "WebsiteContentTypes" };
            modelBuilder.Entity<Lookup>().HasData(
                requestTypeLookup,
                labelTypeLookup,
                measurementUnitLookup,
                visualAdTypeLookup,
                envAdTypeLookup,
                webContentTypeLookup);

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

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 11, LookupId = 2, Value = "سم" },
                new LookupItem { Id = 12, LookupId = 2, Value = "کود" },
                new LookupItem { Id = 13, LookupId = 2, Value = "بذر" },
                new LookupItem { Id = 14, LookupId = 2, Value = "سایر" }
            );

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 15, LookupId = 3, Value = "عدد" },
                new LookupItem { Id = 16, LookupId = 3, Value = "بسته" },
                new LookupItem { Id = 17, LookupId = 3, Value = "لیتر" },
                new LookupItem { Id = 18, LookupId = 3, Value = "کارتن" },
                new LookupItem { Id = 19, LookupId = 3, Value = "کیلوگرم" },
                new LookupItem { Id = 20, LookupId = 3, Value = "گرم" },
                new LookupItem { Id = 21, LookupId = 3, Value = "سی‌سی" },
                new LookupItem { Id = 22, LookupId = 3, Value = "متر" },
                new LookupItem { Id = 23, LookupId = 3, Value = "سانتی‌متر" },
                new LookupItem { Id = 24, LookupId = 3, Value = "میلی‌متر" },
                new LookupItem { Id = 25, LookupId = 3, Value = "اینچ" },
                new LookupItem { Id = 26, LookupId = 3, Value = "سایر" }
            );

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 27, LookupId = 4, Value = "کاتالوگ" },
                new LookupItem { Id = 28, LookupId = 4, Value = "بروشور" },
                new LookupItem { Id = 29, LookupId = 4, Value = "لوگو" },
                new LookupItem { Id = 30, LookupId = 4, Value = "پوستر" },
                new LookupItem { Id = 31, LookupId = 4, Value = "کارت ویزیت" },
                new LookupItem { Id = 32, LookupId = 4, Value = "سایر" }
            );

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 33, LookupId = 5, Value = "بنر" },
                new LookupItem { Id = 34, LookupId = 5, Value = "بیلبورد" },
                new LookupItem { Id = 35, LookupId = 5, Value = "مش" },
                new LookupItem { Id = 36, LookupId = 5, Value = "رول‌آپ" },
                new LookupItem { Id = 37, LookupId = 5, Value = "پرچم" },
                new LookupItem { Id = 38, LookupId = 5, Value = "شاسی" },
                new LookupItem { Id = 39, LookupId = 5, Value = "سایر" }
            );

            modelBuilder.Entity<LookupItem>().HasData(
                new LookupItem { Id = 40, LookupId = 6, Value = "مقاله" },
                new LookupItem { Id = 41, LookupId = 6, Value = "خبر" },
                new LookupItem { Id = 42, LookupId = 6, Value = "صفحه محصول" },
                new LookupItem { Id = 43, LookupId = 6, Value = "سایر" }
            );

            modelBuilder.Entity<SystemSetting>().HasData(
                // new SystemSetting { Id = 1, SettingKey = "DeadlineWarningDays", SettingValue = "2" },
                new SystemSetting { Id = 2, SettingKey = "MaxNormalRequestsPerDay", SettingValue = "5" },
                new SystemSetting { Id = 3, SettingKey = "MaxUrgentRequestsPerDay", SettingValue = "2" },
                new SystemSetting { Id = 4, SettingKey = "OrderableDaysInFuture", SettingValue = "30" },
                new SystemSetting { Id = 5, SettingKey = "DefaultDesignerId", SettingValue = "b5fc3c65-9d43-4558-bb11-dd82eba9149d" }

            );

            // InboxView configuration
            modelBuilder.Entity<InboxView>()
                .HasOne(iv => iv.User)
                .WithMany()
                .HasForeignKey(iv => iv.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InboxView>()
                .HasIndex(iv => new { iv.UserId, iv.InboxCategory })
                .IsUnique();

            // RequestView configuration
            modelBuilder.Entity<RequestView>()
                .HasOne(rv => rv.User)
                .WithMany()
                .HasForeignKey(rv => rv.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RequestView>()
                .HasOne(rv => rv.Request)
                .WithMany()
                .HasForeignKey(rv => rv.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Composite unique index to ensure one view record per user per request per status
            modelBuilder.Entity<RequestView>()
                .HasIndex(rv => new { rv.UserId, rv.RequestId, rv.ViewedAtStatus })
                .IsUnique();

            // Index for faster querying of user's viewed requests
            modelBuilder.Entity<RequestView>()
                .HasIndex(rv => new { rv.UserId, rv.RequestId });

            // DesignerNote configuration
            modelBuilder.Entity<DesignerNote>()
                .HasOne(dn => dn.Designer)
                .WithMany()
                .HasForeignKey(dn => dn.DesignerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DesignerNote>()
                .HasOne(dn => dn.Request)
                .WithMany()
                .HasForeignKey(dn => dn.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Index for faster querying of designer notes
            modelBuilder.Entity<DesignerNote>()
                .HasIndex(dn => new { dn.RequestId, dn.DesignerId, dn.IsDeleted });
        }
    }
}
