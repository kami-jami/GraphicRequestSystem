# 🎨 Graphic Request System

A comprehensive full-stack web application for managing graphic design requests, built with **React** (TypeScript) and **ASP.NET Core**.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![.NET](https://img.shields.io/badge/.NET-9.0-purple?logo=.net)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

- 🎯 **Request Management** - Submit, track, and manage graphic design requests
- 📊 **Dashboard** - Real-time statistics and visual insights
- 👥 **Multi-Role System** - Admin, Approver, Designer, and Requester roles
- 🔔 **Real-time Notifications** - SignalR-powered live updates
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔒 **JWT Authentication** - Secure authentication and authorization
- 🚀 **Containerized** - Full Docker support for easy deployment
- 📂 **File Management** - Upload and manage design files
- 💬 **Comments System** - Collaborate with team members
- 🎨 **Modern UI** - Material-UI components with custom styling

---

## 🏗️ Tech Stack

### Backend
- **Framework:** ASP.NET Core 9.0
- **Database:** SQL Server 2022
- **ORM:** Entity Framework Core 9.0
- **Authentication:** JWT Bearer Token
- **Background Jobs:** Hangfire
- **Real-time:** SignalR
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 19.1 with TypeScript
- **Build Tool:** Vite 7.1
- **UI Library:** Material-UI (MUI) 7.3
- **State Management:** Redux Toolkit 2.9
- **Routing:** React Router 7.1
- **HTTP Client:** RTK Query
- **Web Server:** Nginx (Alpine)

### DevOps
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **CI/CD Ready:** GitHub Actions compatible

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2.0+
- 4GB+ RAM available for Docker

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/GraphicRequestSystem.git
   cd GraphicRequestSystem
   ```

2. **⚠️ IMPORTANT: Configure Secrets**
   
   This project uses environment variables for security. **You MUST configure your secrets before running:**
   
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env and replace ALL placeholder values
   nano .env  # or use your preferred editor
   ```
   
   **Required Configuration:**
   - `SQL_SERVER_PASSWORD` - Strong database password
   - `JWT_KEY` - 64+ character random secret key
   
   📖 **See [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md) for detailed instructions**

3. **Start the application:**
   ```bash
   # Development mode
   docker-compose -f docker-compose.dev.yml up -d
   
   # OR Production mode
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **API:** http://localhost:5000/swagger
   - **Database:** localhost:1433

5. **Login with default admin account:**
   - **Email:** `admin@graphicrequest.com`
   - **Password:** `Admin@123456`
   - ⚠️ **Change the password immediately after first login!**

---

## 📖 Documentation

- **[Docker Setup Guide](DOCKER_README.md)** - Complete Docker deployment instructions
- **[Security Configuration](SECURITY_CONFIGURATION.md)** - **REQUIRED READING** - Secrets management guide
- **[Design System](DESIGN_SYSTEM_GUIDE.md)** - UI/UX design guidelines
- **[API Documentation](http://localhost:5000/swagger)** - Interactive API docs (when running)

---

## 🔒 Security

This project takes security seriously:

- ✅ **No hardcoded secrets** - All sensitive data is in environment variables
- ✅ **`.env` files are gitignored** - Your secrets never touch version control
- ✅ **JWT authentication** - Secure token-based auth
- ✅ **SQL injection protection** - Parameterized queries via EF Core
- ✅ **CORS configured** - Controlled cross-origin access
- ✅ **HTTPS ready** - SSL/TLS support for production

### ⚠️ Before Production Deployment

1. **Generate strong secrets:**
   ```bash
   # JWT Key (64+ characters)
   openssl rand -base64 64
   ```

2. **Use environment-specific configurations:**
   - Development: `.env.development`
   - Staging: `.env.staging`
   - Production: `.env.production`

3. **Consider using secrets management:**
   - Azure Key Vault
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

4. **Enable HTTPS and use production-grade passwords**

📖 **Full security guide:** [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)

---

## 🏭 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare CDN (Optional)               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Nginx (Port 3000)  │
                  │  ┌────────────────┐  │
                  │  │  React App     │  │
                  │  │  (Static SPA)  │  │
                  │  └────────────────┘  │
                  │          │           │
                  │  ┌───────▼────────┐  │
                  │  │ Reverse Proxy  │  │
                  │  │  /api → API    │  │
                  │  │  /hubs → SignalR│  │
                  │  └───────┬────────┘  │
                  └──────────┼───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  API (Port 5000)     │
                  │  ┌────────────────┐  │
                  │  │ ASP.NET Core   │  │
                  │  │ + SignalR      │  │
                  │  │ + Hangfire     │  │
                  │  └───────┬────────┘  │
                  └──────────┼───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ SQL Server (1433)    │
                  │  ┌────────────────┐  │
                  │  │ GraphicRequestDb│  │
                  │  └────────────────┘  │
                  └──────────────────────┘
```

---

## 📦 Project Structure

```
GraphicRequestSystem/
├── GraphicRequestSystem.API/          # Backend API
│   ├── Controllers/                   # API endpoints
│   ├── Core/                         # Domain entities & interfaces
│   ├── Infrastructure/               # Data access & services
│   ├── Hubs/                         # SignalR hubs
│   └── Dockerfile                    # API container config
│
├── graphic-request-client/           # Frontend SPA
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   ├── components/               # Reusable components
│   │   ├── services/                 # API integration
│   │   ├── layouts/                  # Layout components
│   │   └── App.tsx                   # Root component
│   ├── nginx.conf                    # Nginx reverse proxy config
│   └── Dockerfile                    # Frontend container config
│
├── docker-compose.yml                # Default compose file
├── docker-compose.dev.yml            # Development compose
├── docker-compose.prod.yml           # Production compose
├── .env.example                      # Environment template ⚠️
├── .gitignore                        # Git ignore rules
├── SECURITY_CONFIGURATION.md         # Security guide ⚠️
└── README.md                         # This file
```

---

## 🛠️ Development

### Running Locally (Without Docker)

**Backend:**
```bash
cd GraphicRequestSystem.API
dotnet restore
dotnet run
```

**Frontend:**
```bash
cd graphic-request-client
npm install
npm run dev
```

### Building for Production

```bash
# Build all containers
docker-compose -f docker-compose.prod.yml build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Stopping Services

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

---

## 🧪 Testing

```bash
# Backend tests
cd GraphicRequestSystem.API
dotnet test

# Frontend tests
cd graphic-request-client
npm test
```

---

## 📊 Database Migrations

Migrations are automatically applied on startup. To create new migrations:

```bash
cd GraphicRequestSystem.API
dotnet ef migrations add MigrationName
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed
- **Never commit secrets or `.env` files!**

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api
docker-compose logs client
docker-compose logs sqlserver

# Verify .env file exists and is configured
cat .env
```

### Database connection issues

```bash
# Restart database with fresh volume
docker-compose down -v
docker-compose up -d sqlserver
# Wait 30 seconds for database to initialize
docker-compose up -d api client
```

### JWT authentication errors

- Verify `JWT_KEY` is set in `.env`
- Ensure key is at least 64 characters
- Restart API container after changing JWT_KEY

For more troubleshooting, see [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md#-troubleshooting)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- Microsoft for ASP.NET Core and SQL Server
- React team for the amazing framework
- Docker for containerization technology

---

## ⚠️ Important Reminders

1. **NEVER commit `.env` files** - They contain secrets!
2. **Always use `.env.example` as a template** - It has placeholders, not real secrets
3. **Change default admin password** - After first login
4. **Use strong passwords in production** - Minimum 16 characters
5. **Read the security documentation** - [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)

---

**Happy Coding! 🚀**
