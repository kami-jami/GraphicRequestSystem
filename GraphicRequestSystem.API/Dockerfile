# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["GraphicRequestSystem.API.csproj", "./"]
RUN dotnet restore "GraphicRequestSystem.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "GraphicRequestSystem.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "GraphicRequestSystem.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create uploads directory
RUN mkdir -p wwwroot/uploads

# Copy published files
COPY --from=publish /app/publish .

# Expose port
EXPOSE 80

# Set entry point
ENTRYPOINT ["dotnet", "GraphicRequestSystem.API.dll"]
