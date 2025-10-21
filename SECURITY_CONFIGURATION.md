# 🔒 Security Configuration Guide

## Overview

This project has been configured to **remove all hardcoded secrets** from version control. All sensitive information is now managed through environment variables.

---

## ⚠️ CRITICAL: Before You Start

**The project will NOT run without proper configuration!**

You MUST create a `.env` file with your secrets before running the application.

---

## 🚀 Quick Start Guide

### Step 1: Copy the Environment Template

```bash
# On Linux/Mac
cp .env.example .env

# On Windows PowerShell
copy .env.example .env
```

### Step 2: Edit the .env File

Open `.env` in your text editor and replace ALL placeholder values:

```bash
# ❌ WRONG - Don't leave these placeholder values!
SQL_SERVER_PASSWORD=CHANGE_ME_TO_A_STRONG_PASSWORD
JWT_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_MINIMUM_64_CHARACTERS

# ✅ CORRECT - Use real, secure values
SQL_SERVER_PASSWORD=MySecure$QLp@ssw0rd2024!
JWT_KEY=aB3dF8kL9mN0pQ2rS5tV7wX1yZ4cE6gH8jK0mN3pQ5rS8tV0wX2yZ5cE7gH9jK2mN
```

### Step 3: Generate Secure Secrets

#### For JWT Secret Key (64+ characters):

**Option 1: Online Generator**
- Visit: https://generate-secret.vercel.app/64
- Copy the generated key

**Option 2: OpenSSL (Linux/Mac/Git Bash)**
```bash
openssl rand -base64 64
```

**Option 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Option 4: PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,61,63,64,94) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

#### For Database Password:
- Minimum 12 characters (16+ recommended)
- Mix of uppercase, lowercase, numbers, and special characters
- Example: `Gr@ph1cReq$yst3m2024!`

### Step 4: Start the Application

```bash
# Development mode
docker-compose -f docker-compose.dev.yml up -d

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📁 File Structure

```
GraphicRequestSystem/
├── .env                    # ❌ NEVER COMMIT (contains actual secrets)
├── .env.example            # ✅ Template file (safe to commit)
├── .gitignore              # Ensures .env is never committed
├── docker-compose.yml      # Uses environment variables
├── docker-compose.dev.yml  # Development configuration
└── docker-compose.prod.yml # Production configuration
```

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SQL_SERVER_PASSWORD` | SQL Server SA password | `MySecure$QLp@ss!` |
| `JWT_KEY` | JWT signing secret (64+ chars) | `aB3dF8kL9mN0pQ2rS5tV7wX1yZ...` |

### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_NAME` | `GraphicRequestDb` | Database name |
| `SQL_SERVER_PORT` | `1433` | SQL Server port |
| `JWT_ISSUER` | `http://localhost:5000` | JWT issuer URL |
| `JWT_AUDIENCE` | `http://localhost:5000` | JWT audience URL |
| `ASPNETCORE_ENVIRONMENT` | `Development` | Environment name |
| `API_PORT` | `5000` | API port |
| `CLIENT_PORT` | `3000` | Frontend port |
| `VITE_API_BASE_URL` | `/api` | API base URL for frontend |

---

## 🏭 Production Deployment

### Environment-Specific Files

Create separate `.env` files for each environment:

```bash
.env.development    # Development settings
.env.staging        # Staging settings
.env.production     # Production settings (NEVER COMMIT!)
```

Load the appropriate file:

```bash
# Development
docker-compose --env-file .env.development -f docker-compose.dev.yml up -d

# Production
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### Production Security Checklist

- [ ] **Use production-grade secrets**
  - [ ] SQL password: 16+ characters, high complexity
  - [ ] JWT key: 64+ characters, cryptographically random
  
- [ ] **Update URLs**
  - [ ] Set `JWT_ISSUER` to your production API URL
  - [ ] Set `JWT_AUDIENCE` to your production API URL
  
- [ ] **Enable production mode**
  - [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
  
- [ ] **Use HTTPS**
  - [ ] Configure SSL/TLS certificates
  - [ ] Update all URLs to use `https://`
  
- [ ] **Implement secrets management**
  - [ ] Azure Key Vault
  - [ ] AWS Secrets Manager
  - [ ] HashiCorp Vault
  - [ ] Docker Secrets (Swarm mode)
  - [ ] Kubernetes Secrets
  
- [ ] **Rotate secrets regularly**
  - [ ] Every 90 days recommended
  - [ ] Immediately after suspected compromise
  
- [ ] **Monitor and audit**
  - [ ] Enable authentication logging
  - [ ] Set up alerts for failed login attempts
  - [ ] Monitor for unusual database activity

---

## 🐳 Docker Secrets (Advanced)

For Docker Swarm deployments, use Docker Secrets instead of environment variables:

### 1. Create Secrets

```bash
# Create SQL password secret
echo "MySecurePassword" | docker secret create sql_password -

# Create JWT key secret
echo "MyLongJWTSecretKey..." | docker secret create jwt_key -
```

### 2. Update docker-compose.yml

```yaml
services:
  api:
    environment:
      - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=GraphicRequestDb;User Id=sa;Password_File=/run/secrets/sql_password;
      - Jwt__Key_File=/run/secrets/jwt_key
    secrets:
      - sql_password
      - jwt_key

secrets:
  sql_password:
    external: true
  jwt_key:
    external: true
```

---

## ☁️ Cloud Provider Secrets

### Azure Key Vault

```csharp
// Add to Program.cs
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{keyVaultName}.vault.azure.net/"),
    new DefaultAzureCredential());
```

### AWS Secrets Manager

```bash
# Install AWS CLI and configure
aws secretsmanager create-secret \
    --name GraphicRequestSystem/SQL_PASSWORD \
    --secret-string "MySecurePassword"
```

### Google Cloud Secret Manager

```bash
# Create secret
gcloud secrets create sql-password --data-file=-
# Type your password and press Ctrl+D
```

---

## 🚨 Security Best Practices

### 1. Never Commit Secrets

```bash
# Check before committing
git status

# If you see .env, DO NOT COMMIT!
# .env should appear in .gitignore
```

### 2. Rotate Secrets Regularly

```bash
# Generate new JWT key every 90 days
openssl rand -base64 64

# Update .env
# Restart services
docker-compose restart api
```

### 3. Use Strong Passwords

**Bad Examples:**
- ❌ `password123`
- ❌ `admin`
- ❌ `GraphicRequestSystem`

**Good Examples:**
- ✅ `Gr@ph1cReq$yst3m2024!Secure`
- ✅ `9mK#nB$7pL@2wQ5xR8tY!3v`
- ✅ `Zx9$Bm#7Nq!2Wp5@Rt8Lk3Yv`

### 4. Limit Secret Access

- Only give secrets to people who absolutely need them
- Use separate secrets for development and production
- Never send secrets via email or Slack
- Use secure secret sharing tools (1Password, LastPass Teams, etc.)

### 5. Monitor for Leaked Secrets

Use tools to scan for accidentally committed secrets:

```bash
# Install git-secrets
# https://github.com/awslabs/git-secrets

git secrets --scan
```

---

## 🆘 Troubleshooting

### Error: "SA_PASSWORD environment variable not set"

**Problem:** `.env` file is missing or not loaded

**Solution:**
```bash
# 1. Check if .env exists
ls -la .env

# 2. If not, copy from template
cp .env.example .env

# 3. Edit and add your secrets
nano .env  # or use your preferred editor
```

### Error: "JWT Key cannot be null"

**Problem:** `JWT_KEY` is not set in `.env`

**Solution:**
```bash
# Generate a secure key
openssl rand -base64 64

# Add to .env file
echo "JWT_KEY=<your-generated-key>" >> .env
```

### Error: "Login failed for user 'sa'"

**Problem:** Database password mismatch

**Solution:**
1. Check `SQL_SERVER_PASSWORD` in `.env`
2. Restart database container: `docker-compose restart sqlserver`
3. If still failing, remove volume and recreate:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Container Starts Then Stops Immediately

**Problem:** Environment variables not loaded

**Solution:**
```bash
# Verify .env file is in the same directory as docker-compose.yml
pwd
ls -la .env

# Check if variables are loaded
docker-compose config
```

---

## 📚 Additional Resources

- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [ASP.NET Core Configuration](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)

---

## ✅ Verification Checklist

Before pushing to GitHub:

- [ ] `.env` file exists locally (for your development)
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has NO real secrets (only placeholders)
- [ ] All `docker-compose*.yml` files use environment variables
- [ ] No hardcoded passwords in any committed files
- [ ] Documentation is complete and clear

Run this command to check:

```bash
# Search for potential secrets in git-tracked files
git grep -i "password\|secret\|key" -- '*.yml' '*.yaml' '*.json'
```

If this returns any hardcoded secrets, you need to fix them!

---

## 📞 Support

If you encounter issues:

1. Read this documentation thoroughly
2. Check the Troubleshooting section
3. Review Docker logs: `docker-compose logs`
4. Open an issue in the GitHub repository

---

**Remember: Security is not a one-time task. Regularly review and update your security practices!** 🔒
