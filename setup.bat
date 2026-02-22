@echo off
REM BRIMOB Panic Alert System - Setup Script for Windows
REM Quick setup untuk development

echo.
echo ========================================
echo BRIMOB Panic Alert System - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo X Node.js belum terinstall!
    echo Install Node.js dari: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo [OK] NPM version:
npm -v
echo.

REM Install dependencies
echo Installing dependencies...
echo.
call npm install

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo [OK] Setup berhasil!
    echo ========================================
    echo.
    echo Untuk menjalankan aplikasi:
    echo    npm run dev
    echo.
    echo Baca QUICK_START.md untuk panduan lengkap
    echo Baca FILE_SUMMARY.md untuk detail file structure
    echo.
    echo Login Credentials:
    echo    Admin: admin / admin123
    echo    User:  user1 / user123
    echo.
) else (
    echo.
    echo [ERROR] Setup gagal!
    echo Pastikan Node.js dan npm sudah terinstall dengan benar
    pause
    exit /b 1
)

pause
