# Docker Setup for Graphic Request System

This document explains how to run the Graphic Request System using Docker.

## ⚠️ IMPORTANT: Security Configuration Required

**Before starting, you MUST configure your secrets!**

This project uses environment variables for security. Follow these steps:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and replace ALL placeholder values** with secure secrets

3. **Read the full security guide:** [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)

**The application will NOT start without proper configuration!**

---

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB+ RAM available for Docker
- Ports 3000, 5000, and 1433 available
- **A configured `.env` file with your secrets** ⚠️

## 🏗️ Architecture

The application consists of three services:

1. **SQL Server** (Port 1433) - Database
2. **API** (Port 5000) - ASP.NET Core Backend
3. **Client** (Port 3000) - React Frontend

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│     API     │────────▶│  SQL Server │
│  (React)    │         │ (.NET Core) │         │   (MSSQL)   │
│  Port 3000  │         │  Port 5000  │         │  Port 1433  │
└─────────────┘         └─────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Option 1: Production Build

```bash
# 1. Clone the repository
git clone <repository-url>
cd GraphicRequestSystem

# 2. Configure secrets (REQUIRED!)
cp .env.example .env
# Edit .env and add your secure passwords and keys
# See SECURITY_CONFIGURATION.md for detailed instructions

# 3. Build and start all services
docker-compose up -d

# 4. Wait for services to be healthy (30-60 seconds)
docker-compose ps

# 5. Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5000/swagger
# Database: localhost:1433 (sa/[password from .env])
```

### Option 2: Development Mode

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

## 📝 Detailed Setup

### Step 1: Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
SQL_SERVER_PASSWORD=YourStrong@Password123
DATABASE_NAME=GraphicRequestDb

# API
JWT_KEY=your-super-secret-key-here

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 2: Build Images

```bash
# Build all images
docker-compose build

# Or build specific service
docker-compose build api
docker-compose build client
```

### Step 3: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d sqlserver
```

### Step 4: Initialize Database

The API will automatically run migrations on startup. If you need to manually initialize:

```bash
# Access API container
docker exec -it graphicrequest-api bash

# Run migrations
dotnet ef database update
```

### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **API Swagger**: http://localhost:5000/swagger
- **API Health**: http://localhost:5000/api/health

## 🔧 Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f sqlserver
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Execute Commands in Containers

```bash
# API container
docker exec -it graphicrequest-api bash

# SQL Server container
docker exec -it graphicrequest-sqlserver bash

# Client container
docker exec -it graphicrequest-client sh
```

### Check Service Health

```bash
# Check status
docker-compose ps

# Check health
docker inspect --format='{{.State.Health.Status}}' graphicrequest-sqlserver
```

## 🗄️ Database Management

### Backup Database

```bash
# Create backup
docker exec graphicrequest-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Password123 \
  -Q "BACKUP DATABASE [GraphicRequestDb] TO DISK = N'/var/opt/mssql/backup/GraphicRequestDb.bak' WITH NOFORMAT, NOINIT, NAME = 'GraphicRequestDb-full', SKIP, NOREWIND, NOUNLOAD, STATS = 10"

# Copy backup to host
docker cp graphicrequest-sqlserver:/var/opt/mssql/backup/GraphicRequestDb.bak ./backup/
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backup/GraphicRequestDb.bak graphicrequest-sqlserver:/var/opt/mssql/backup/

# Restore
docker exec graphicrequest-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Password123 \
  -Q "RESTORE DATABASE [GraphicRequestDb] FROM DISK = N'/var/opt/mssql/backup/GraphicRequestDb.bak' WITH FILE = 1, NOUNLOAD, REPLACE, STATS = 5"
```

### Connect to Database

```bash
# Using SQL Server Management Studio (SSMS)
Server: localhost,1433
Login: sa
Password: YourStrong@Password123

# Using sqlcmd in container
docker exec -it graphicrequest-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Password123
```

## 🔍 Troubleshooting

### API Can't Connect to Database

**Symptom**: API logs show "Cannot connect to SQL Server"

**Solution**:
```bash
# Check SQL Server is running
docker-compose ps sqlserver

# Check SQL Server logs
docker-compose logs sqlserver

# Wait for SQL Server to be healthy
docker inspect --format='{{.State.Health.Status}}' graphicrequest-sqlserver
```

### Frontend Can't Connect to API

**Symptom**: Network errors in browser console

**Solution**:
1. Check API is running: `docker-compose ps api`
2. Verify API URL in browser: http://localhost:5000/swagger
3. Check CORS settings in API `Program.cs`
4. Rebuild client with correct API URL:
   ```bash
   docker-compose build --build-arg VITE_API_BASE_URL=http://localhost:5000/api client
   ```

### Port Already in Use

**Symptom**: "Port 5000 is already allocated"

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Change port in docker-compose.yml
ports:
  - "5001:80"  # Changed from 5000:80
```

### Container Keeps Restarting

**Symptom**: Service status shows "Restarting"

**Solution**:
```bash
# Check logs for errors
docker-compose logs service-name

# Check if health check is failing
docker inspect service-name | grep -A 10 Health
```

### Database Data Lost After Restart

**Issue**: Data disappears when containers restart

**Solution**: Ensure volumes are properly configured
```bash
# Check volumes
docker volume ls | grep graphicrequest

# Don't use 'docker-compose down -v' unless you want to delete data
```

## 🔒 Production Considerations

### Security

1. **Change Default Passwords**:
   - SQL Server SA password
   - JWT secret key

2. **Use Environment Variables**:
   ```bash
   # Don't commit .env file
   echo ".env" >> .gitignore
   ```

3. **Enable HTTPS**:
   - Use reverse proxy (Nginx/Traefik)
   - Add SSL certificates
   - Update `docker-compose.yml` for HTTPS

4. **Secure SQL Server**:
   - Change SA password
   - Create limited user accounts
   - Restrict network access

### Performance

1. **Resource Limits**:
   ```yaml
   services:
     api:
       deploy:
         resources:
           limits:
             cpus: '2.0'
             memory: 2G
           reservations:
             cpus: '1.0'
             memory: 1G
   ```

2. **Database Optimization**:
   - Regular backups
   - Index optimization
   - Query performance monitoring

3. **Caching**:
   - Add Redis for session/cache
   - Enable response caching in API

### Monitoring

1. **Health Checks**:
   - Already configured for SQL Server
   - Add health endpoints to API

2. **Logging**:
   ```bash
   # Configure log drivers
   services:
     api:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

3. **Metrics**:
   - Add Prometheus/Grafana
   - Monitor container stats
   - Track API performance

## 🚢 Deployment

### Push to Registry

```bash
# Tag images
docker tag graphicrequest-api:latest your-registry/graphicrequest-api:latest
docker tag graphicrequest-client:latest your-registry/graphicrequest-client:latest

# Push to registry
docker push your-registry/graphicrequest-api:latest
docker push your-registry/graphicrequest-client:latest
```

### Deploy to Server

```bash
# SSH to server
ssh user@your-server

# Pull latest compose file
git pull

# Pull images
docker-compose pull

# Restart services
docker-compose up -d

# Check status
docker-compose ps
```

## 📊 Volume Management

### List Volumes

```bash
docker volume ls | grep graphicrequest
```

### Backup Volumes

```bash
# Backup uploads
docker run --rm -v graphicrequest_api-uploads:/data -v $(pwd)/backup:/backup alpine tar czf /backup/uploads.tar.gz -C /data .

# Backup database
docker run --rm -v graphicrequest_sqlserver-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/database.tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore uploads
docker run --rm -v graphicrequest_api-uploads:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/uploads.tar.gz -C /data

# Restore database
docker run --rm -v graphicrequest_sqlserver-data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/database.tar.gz -C /data
```

## 🧪 Testing

### Run Tests in Container

```bash
# Build test image
docker build -f GraphicRequestSystem.API/Dockerfile.test -t graphicrequest-api-test .

# Run tests
docker run --rm graphicrequest-api-test
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
docker-compose -f docker-compose.test.yml run api-test

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ASP.NET Core Docker Images](https://hub.docker.com/_/microsoft-dotnet-aspnet)
- [SQL Server Docker Images](https://hub.docker.com/_/microsoft-mssql-server)
- [Nginx Docker Images](https://hub.docker.com/_/nginx)

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Check network connectivity: `docker network inspect graphicrequest-network`
4. Review this documentation
5. Open an issue on GitHub

## 📝 License

[Your License Here]
