# 🔒 GitHub Publishing Security Checklist

## ✅ Pre-Commit Verification

Before pushing your code to GitHub, **verify that NO secrets are exposed:**

### 1. Check for Hardcoded Secrets

Run this command to search for potential secrets in git-tracked files:

```bash
# Search for passwords, keys, and secrets
git grep -i "password\|secret\|key" -- '*.yml' '*.yaml' '*.json' '*.cs' '*.tsx' '*.ts' | grep -v ".example"
```

**Expected Result:** Should return ONLY:
- References to environment variables like `${SQL_SERVER_PASSWORD}`
- Comments or documentation
- Variable names (not actual secret values)

**If you see hardcoded secrets, DO NOT COMMIT!**

---

### 2. Verify .env is Ignored

```bash
# This should return the file path if ignored correctly
git check-ignore .env

# This should return nothing (file not tracked)
git status .env
```

---

### 3. Check What Will Be Committed

```bash
# See what files will be committed
git status

# View changes in docker-compose files
git diff docker-compose.yml
git diff docker-compose.dev.yml
git diff docker-compose.prod.yml
```

**Verify:**
- ✅ `.env` is NOT in the list
- ✅ `.env.example` IS in the list (it's safe to commit)
- ✅ Docker compose files use `${VARIABLE}` not hardcoded values

---

### 4. Verify .env.example Has NO Real Secrets

```bash
# View the example file
cat .env.example
```

**Check that ALL values are placeholders:**
- ❌ `SQL_SERVER_PASSWORD=DevPassword@123`
- ✅ `SQL_SERVER_PASSWORD=CHANGE_ME_TO_A_STRONG_PASSWORD`

---

## 📋 Files Modified (Safe to Commit)

These files have been updated and are **SAFE to commit**:

### ✅ Configuration Files
- [x] `docker-compose.yml` - Uses environment variables
- [x] `docker-compose.dev.yml` - Uses environment variables
- [x] `docker-compose.prod.yml` - Already used environment variables
- [x] `.env.example` - Contains only placeholders
- [x] `.gitignore` - Ignores .env files

### ✅ Documentation Files
- [x] `SECURITY_CONFIGURATION.md` - Complete security guide
- [x] `README.md` - GitHub repository readme
- [x] `DOCKER_README.md` - Updated with security notes
- [x] `GITHUB_SECURITY_CHECKLIST.md` - This file

---

## ❌ Files That Should NEVER Be Committed

These files should **NEVER** appear in git:

- ❌ `.env` - Contains your actual secrets
- ❌ `.env.local`
- ❌ `.env.development` (if contains real secrets)
- ❌ `.env.production` (if contains real secrets)
- ❌ Any file with real passwords or API keys

---

## 🚀 Safe Commit & Push Procedure

### Step 1: Stage Safe Files

```bash
# Add only the files we modified
git add docker-compose.yml
git add docker-compose.dev.yml
git add .env.example
git add .gitignore
git add SECURITY_CONFIGURATION.md
git add README.md
git add DOCKER_README.md
git add GITHUB_SECURITY_CHECKLIST.md
git add DashboardPage.tsx  # If you made the button fix
```

### Step 2: Verify Staging

```bash
# See what's staged for commit
git status

# Double-check no .env file is staged
git diff --staged --name-only | grep -i "\.env$"
```

**If `.env` appears, STOP and unstage it:**
```bash
git reset .env
```

### Step 3: Commit with Clear Message

```bash
git commit -m "Security: Remove hardcoded secrets and implement environment variable configuration

- Replaced all hardcoded passwords with environment variables
- Updated docker-compose files to use ${VARIABLE} syntax
- Created comprehensive security documentation
- Added .env.example as template (no real secrets)
- Ensured .env is properly gitignored
- Updated README with security warnings

BREAKING CHANGE: Users must now create .env file before running
See SECURITY_CONFIGURATION.md for setup instructions"
```

### Step 4: Final Pre-Push Verification

```bash
# Show what will be pushed
git log origin/master..HEAD --name-only

# Verify no secrets in the commit
git show HEAD | grep -i "password\|secret" | grep -v "CHANGE_ME\|placeholder\|\${" | grep -v "#"
```

**If this returns any actual secret values, DO NOT PUSH!**

### Step 5: Push to GitHub

```bash
# Push to your repository
git push origin master

# Or if it's a new repo
git push -u origin master
```

---

## 🔍 Post-Push Verification

After pushing, verify on GitHub:

1. **Go to your repository on GitHub**

2. **Check these files:**
   - `docker-compose.yml` - Should show `${SQL_SERVER_PASSWORD}` not actual password
   - `.env.example` - Should show `CHANGE_ME_TO...` placeholders
   - `.env` - Should NOT exist in the repository

3. **Use GitHub's search to verify:**
   - Search in your repo for any known secret values
   - If found, you need to remove them from git history (see below)

---

## 🆘 If You Accidentally Committed Secrets

### Option 1: Not Pushed Yet (Safe)

```bash
# Remove last commit but keep changes
git reset --soft HEAD~1

# Or completely undo the commit
git reset --hard HEAD~1

# Fix the files, then commit again
```

### Option 2: Already Pushed (Requires Force Push)

⚠️ **WARNING: This rewrites history. Only do this if repository is private or newly created!**

```bash
# Remove last commit
git reset --hard HEAD~1

# Force push to overwrite remote
git push -f origin master
```

### Option 3: Secrets Exposed in History

If secrets are in older commits, you need to:

1. **Immediately rotate all exposed secrets:**
   - Change database passwords
   - Generate new JWT keys
   - Update your `.env` file
   - Restart services

2. **Clean git history:**
   ```bash
   # Use BFG Repo Cleaner or git filter-branch
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```

3. **Consider making repository private** until cleaned

---

## 📧 Setting Up for Collaborators

When others clone your repository, they need to:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/GraphicRequestSystem.git
   cd GraphicRequestSystem
   ```

2. **Create their own .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure their secrets:**
   - Edit `.env` file
   - Add their own passwords and keys
   - Follow instructions in `SECURITY_CONFIGURATION.md`

4. **Start the application:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

---

## 🔄 Regular Maintenance

### Monthly Security Review

- [ ] Rotate JWT secrets (every 90 days)
- [ ] Update database passwords
- [ ] Review access logs for suspicious activity
- [ ] Check dependencies for vulnerabilities
- [ ] Verify `.gitignore` still includes `.env`

### Before Each Release

- [ ] Run security checklist
- [ ] Verify no secrets in code
- [ ] Update documentation
- [ ] Test with fresh `.env` from template

---

## 📚 Additional Security Resources

- **GitHub Secrets Scanning:** https://docs.github.com/en/code-security/secret-scanning
- **git-secrets Tool:** https://github.com/awslabs/git-secrets
- **OWASP Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **12-Factor App:** https://12factor.net/config

---

## ✅ Final Checklist

Before pushing to GitHub, confirm:

- [ ] All hardcoded secrets removed from docker-compose files
- [ ] `.env.example` contains only placeholders (no real secrets)
- [ ] `.env` is in `.gitignore` and not tracked by git
- [ ] `SECURITY_CONFIGURATION.md` is complete and committed
- [ ] `README.md` includes security warnings
- [ ] Ran `git grep` to search for secrets (found none)
- [ ] Verified `git status` shows no `.env` file
- [ ] Tested that application still works with environment variables
- [ ] Created a personal `.env` file locally for development
- [ ] Documented default admin password and advised to change it

---

## 🎉 You're Ready!

If all checks pass, you can safely push to GitHub!

```bash
git push origin master
```

**Remember:** Security is an ongoing process. Review this checklist regularly and stay vigilant about secret management.

---

**Stay Secure! 🔒**
