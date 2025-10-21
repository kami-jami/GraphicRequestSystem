@echo off
REM Stop and cleanup script for Graphic Request System

echo ========================================
echo Graphic Request System - Cleanup
echo ========================================
echo.

echo Select cleanup option:
echo 1. Stop services only
echo 2. Stop and remove containers
echo 3. Stop, remove containers and volumes (WARNING: Data will be deleted!)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Stopping services...
    docker-compose stop
    echo [OK] Services stopped
) else if "%choice%"=="2" (
    echo.
    echo [INFO] Stopping and removing containers...
    docker-compose down
    echo [OK] Containers removed
) else if "%choice%"=="3" (
    echo.
    echo [WARNING] This will delete all data including database!
    set /p confirm="Are you sure? (yes/no): "
    if "%confirm%"=="yes" (
        echo [INFO] Stopping and removing everything...
        docker-compose down -v
        echo [OK] All containers and volumes removed
    ) else (
        echo [INFO] Cleanup cancelled
    )
) else (
    echo [INFO] Invalid choice. Exiting...
)

echo.
pause
