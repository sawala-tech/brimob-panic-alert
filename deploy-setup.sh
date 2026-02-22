#!/bin/bash

echo "🚀 BRIMOB Panic Alert - Quick Deploy Setup"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
  echo "📦 Initializing Git repository..."
  git init
  git add .
  git commit -m "Initial commit - BRIMOB Panic Alert System POC"
  echo "✅ Git initialized"
else
  echo "✅ Git already initialized"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Push ke GitHub:"
echo "   • Buat repo baru di: https://github.com/new"
echo "   • Nama: brimob-panic-alert"
echo "   • Lalu run:"
echo "     git remote add origin https://github.com/USERNAME/brimob-panic-alert.git"
echo "     git branch -M main"
echo "     git push -u origin main"
echo ""
echo "2️⃣  Deploy Backend ke Render.com:"
echo "   • Buka: https://render.com"
echo "   • Sign up dengan GitHub"
echo "   • New → Web Service → Connect repo"
echo "   • Root Directory: server"
echo "   • Build: npm install"
echo "   • Start: npm start"
echo "   • Add Environment Variables dari server/.env.example"
echo ""
echo "3️⃣  Deploy Frontend ke Vercel:"
echo "   • Buka: https://vercel.com"
echo "   • Sign up dengan GitHub"
echo "   • Import → Select repo"
echo "   • Environment Variables:"
echo "     NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com"
echo "     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com"
echo ""
echo "4️⃣  Test PWA:"
echo "   • Buka Vercel URL di HP"
echo "   • Add to Home Screen"
echo "   • Allow notifications"
echo "   • Test panic alert!"
echo ""
echo "📚 Baca DEPLOYMENT_GUIDE.md untuk detail lengkap"
echo ""
echo "✅ Setup selesai! Happy deploying! 🚀"
