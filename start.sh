#!/bin/bash
# Quick Start Script for Graphic Request System
# This script helps you quickly start the application using Docker

set -e

echo "========================================"
echo "Graphic Request System - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[OK] Docker is running"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env file from template..."
    cp .env.example .env
    echo "[IMPORTANT] Please edit .env file with your configuration!"
    echo "Press any key after editing .env file..."
    read -n 1
fi

echo "[INFO] Checking Docker Compose version..."
docker-compose version
echo ""

# Ask user which environment to start
echo "Select environment to start:"
echo "1. Development (with hot reload)"
echo "2. Production (optimized build)"
echo ""
read -p "Enter your choice (1 or 2): " choice

compose_file="docker-compose.yml"

case $choice in
    1)
        echo ""
        echo "[INFO] Starting Development Environment..."
        compose_file="docker-compose.dev.yml"
        docker-compose -f $compose_file up -d
        ;;
    2)
        echo ""
        echo "[INFO] Starting Production Environment..."
        compose_file="docker-compose.prod.yml"
        docker-compose -f $compose_file up -d
        ;;
    *)
        echo ""
        echo "[INFO] Starting Default Environment..."
        docker-compose up -d
        ;;
esac

echo ""
echo "[INFO] Waiting for services to start..."
sleep 10

echo ""
echo "[INFO] Checking service status..."
docker-compose -f $compose_file ps

echo ""
echo "========================================"
echo "Services are starting up!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:5000/swagger"
echo "Database: localhost:1433"
echo ""
echo "Credentials:"
echo "- Database: sa / YourStrong@Password123"
echo ""
echo "Useful commands:"
echo "- View logs:    docker-compose -f $compose_file logs -f"
echo "- Stop all:     docker-compose -f $compose_file down"
echo "- Restart:      docker-compose -f $compose_file restart"
echo ""
echo "Press any key to view logs (Ctrl+C to exit)..."
read -n 1

docker-compose -f $compose_file logs -f
