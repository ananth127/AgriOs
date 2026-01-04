@echo off
REM Agri-OS GitHub Deployment Script
REM This script helps you push your code to GitHub

echo ========================================
echo Agri-OS GitHub Deployment Script
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo Git repository initialized!
    echo.
)

REM Add remote if not exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding GitHub remote...
    git remote add origin https://github.com/ananth127/AgriOs.git
    echo Remote added!
    echo.
) else (
    echo GitHub remote already exists.
    echo.
)

REM Show current status
echo Current Git Status:
git status
echo.

REM Ask user to continue
set /p continue="Do you want to commit and push all changes? (y/n): "
if /i not "%continue%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b
)

echo.
echo Staging all files...
git add .

echo.
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg=Update Agri-OS application
)

echo.
echo Committing changes...
git commit -m "%commit_msg%"

echo.
echo Setting main branch...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your code has been pushed to:
echo https://github.com/ananth127/AgriOs
echo.
echo Next Steps:
echo 1. Set up Supabase database (see DEPLOYMENT_GUIDE.md)
echo 2. Deploy backend on Render
echo 3. Deploy frontend on Vercel
echo.
echo For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
pause
