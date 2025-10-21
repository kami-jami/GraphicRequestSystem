@echo off
REM Quick Start Script for Graphic Request System
REM This script helps you quickly start the application using Docker

echo ========================================
echo Graphic Request System - Quick Start
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy .env.example .env
    echo [IMPORTANT] Please edit .env file with your configuration!
    echo Press any key after editing .env file...
    pause
)

echo [INFO] Checking Docker Compose version...
docker-compose version
echo.

REM Ask user which environment to start
echo Select environment to start:
echo 1. Development (with hot reload)
echo 2. Production (optimized build)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Starting Development Environment...
    docker-compose -f docker-compose.dev.yml up -d
    set compose_file=docker-compose.dev.yml
) else if "%choice%"=="2" (
    echo.
    echo [INFO] Starting Production Environment...
    docker-compose -f docker-compose.prod.yml up -d
    set compose_file=docker-compose.prod.yml
) else (
    echo.
    echo [INFO] Starting Default Environment...
    docker-compose up -d
    set compose_file=docker-compose.yml
)

echo.
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo [INFO] Checking service status...
docker-compose -f %compose_file% ps

echo.
echo ========================================
echo Services are starting up!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo API:      http://localhost:5000/swagger
echo Database: localhost:1433
echo.
echo Credentials:
echo - Database: sa / YourStrong@Password123
echo.
echo Useful commands:
echo - View logs:    docker-compose -f %compose_file% logs -f
echo - Stop all:     docker-compose -f %compose_file% down
echo - Restart:      docker-compose -f %compose_file% restart
echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul

docker-compose -f %compose_file% logs -f
