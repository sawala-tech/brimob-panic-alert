#!/bin/bash

# BRIMOB Panic Alert System - Setup Script
# Quick setup untuk development

echo "🚔 BRIMOB Panic Alert System - Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js belum terinstall!"
    echo "📥 Install Node.js dari: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup berhasil!"
    echo ""
    echo "🚀 Untuk menjalankan aplikasi:"
    echo "   npm run dev"
    echo ""
    echo "📖 Baca QUICK_START.md untuk panduan lengkap"
    echo "📋 Baca FILE_SUMMARY.md untuk detail file structure"
    echo ""
    echo "🔑 Login Credentials:"
    echo "   Admin: admin / admin123"
    echo "   User:  user1 / user123"
    echo ""
else
    echo ""
    echo "❌ Setup gagal!"
    echo "Pastikan Node.js dan npm sudah terinstall dengan benar"
    exit 1
fi
