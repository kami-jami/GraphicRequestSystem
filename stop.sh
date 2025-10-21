#!/bin/bash
# Stop and cleanup script for Graphic Request System

set -e

echo "========================================"
echo "Graphic Request System - Cleanup"
echo "========================================"
echo ""

echo "Select cleanup option:"
echo "1. Stop services only"
echo "2. Stop and remove containers"
echo "3. Stop, remove containers and volumes (WARNING: Data will be deleted!)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "[INFO] Stopping services..."
        docker-compose stop
        echo "[OK] Services stopped"
        ;;
    2)
        echo ""
        echo "[INFO] Stopping and removing containers..."
        docker-compose down
        echo "[OK] Containers removed"
        ;;
    3)
        echo ""
        echo "[WARNING] This will delete all data including database!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" == "yes" ]; then
            echo "[INFO] Stopping and removing everything..."
            docker-compose down -v
            echo "[OK] All containers and volumes removed"
        else
            echo "[INFO] Cleanup cancelled"
        fi
        ;;
    *)
        echo "[INFO] Invalid choice. Exiting..."
        ;;
esac

echo ""
