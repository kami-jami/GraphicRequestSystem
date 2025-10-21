using GraphicRequestSystem.API.Core.Entities;
using GraphicRequestSystem.API.Infrastructure.BackgroundJobs;
using GraphicRequestSystem.API.Infrastructure.Data;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using GraphicRequestSystem.API.Core.Interfaces;
using GraphicRequestSystem.API.Infrastructure.Strategies;
using GraphicRequestSystem.API.Hubs;
using GraphicRequestSystem.API.Infrastructure.Services;


var builder = WebApplication.CreateBuilder(args);

//builder.Logging.ClearProviders();
//builder.Logging.AddConsole();

//builder.Logging.AddFilter((category, level) =>
//{
//    return category.Contains("designer_pendingAction", StringComparison.OrdinalIgnoreCase);
//});

var myAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Add services to the container.

builder.Services.AddScoped<IRequestDetailStrategy, LabelRequestStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, PackagingPhotoStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, InstagramPostStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, PromotionalVideoStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, WebsiteContentStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, FileEditStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, PromotionalItemStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, VisualAdStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, EnvironmentalAdStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, MiscellaneousStrategy>();
builder.Services.AddScoped<IRequestDetailStrategy, DefaultRequestStrategy>();
builder.Services.AddScoped<RequestDetailStrategyFactory>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Configure Hangfire with retry logic for SQL Server connection
builder.Services.AddHangfire(configuration =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true,
            PrepareSchemaIfNecessary = true // Ensure Hangfire schema is created
        });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: myAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:5173",  // Vite dev server
                    "http://localhost:3000",   // Docker frontend
                    "https://grs.mydevlab.ir" // Cloudflare Tunnel
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // Required for SignalR
        });
});

//JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,  // Disabled for multi-domain support (localhost + Cloudflare Tunnel)
        ValidateAudience = false,  // Disabled for multi-domain support
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };

    // Configure JWT authentication for SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();


builder.Services.AddHangfireServer();

builder.Services.AddSignalR();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();



//builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GraphicRequestSystem API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCors(myAllowSpecificOrigins);

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");

app.UseHangfireDashboard();

// Apply database migrations and seed data with retry logic
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<AppDbContext>();

    int retryCount = 0;
    int maxRetries = 5;
    bool migrationSuccessful = false;

    while (!migrationSuccessful && retryCount < maxRetries)
    {
        try
        {
            retryCount++;
            logger.LogInformation($"Attempting database migration (Attempt {retryCount}/{maxRetries})...");

            // Apply migrations
            context.Database.Migrate();

            logger.LogInformation("Database migrations applied successfully.");
            migrationSuccessful = true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, $"Database migration attempt {retryCount} failed. Waiting 5 seconds before retry...");

            if (retryCount >= maxRetries)
            {
                logger.LogError(ex, "Failed to apply database migrations after {MaxRetries} attempts.", maxRetries);
                throw;
            }

            Thread.Sleep(5000); // Wait 5 seconds before retry
        }
    }
}

RecurringJob.AddOrUpdate<DeadlineCheckerJob>(
    "deadline-checker-job",
    job => job.CheckForUpcomingDeadlines(),
    Cron.Hourly);

// Seed roles
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        string[] roleNames = { "Admin", "Approver", "Designer", "Requester" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
                logger.LogInformation($"Role '{roleName}' created successfully.");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding roles.");
        throw;
    }
}

// Seed default admin user
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Check if admin user already exists
        var adminEmail = "admin@graphicrequest.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            logger.LogInformation("Creating default admin user...");

            // Create admin user
            adminUser = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Administrator",
                IsActive = true,
                PhoneNumber = "0000000000"
            };

            var createResult = await userManager.CreateAsync(adminUser, "Admin@123456");

            if (createResult.Succeeded)
            {
                // Assign Admin role
                await userManager.AddToRoleAsync(adminUser, "Admin");
                logger.LogInformation($"Admin user created successfully with email: {adminEmail}");
                logger.LogInformation($"Default admin password: Admin@123456");
                logger.LogWarning("IMPORTANT: Please change the default admin password after first login!");
            }
            else
            {
                logger.LogError($"Failed to create admin user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }
        }
        else
        {
            logger.LogInformation($"Admin user already exists: {adminEmail}");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding admin user.");
        throw;
    }
}

app.Run();
