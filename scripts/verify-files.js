/**
 * File Verification Script
 * Checks if all required files are present
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // Config
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'next.config.mjs',
  '.gitignore',
  
  // Docs
  'README.md',
  'QUICK_START.md',
  'START_HERE.md',
  
  // PWA
  'public/manifest.json',
  'public/icon-192x192.svg',
  'public/icon-512x512.svg',
  
  // Types
  'src/types/index.ts',
  
  // Store
  'src/store/useAuthStore.ts',
  
  // Lib
  'src/lib/auth.ts',
  'src/lib/broadcast.ts',
  'src/lib/audio.ts',
  
  // Components
  'src/components/Header.tsx',
  'src/components/PanicButton.tsx',
  'src/components/AlertOverlay.tsx',
  'src/components/AlertHistory.tsx',
  
  // Pages
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/app/login/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/user/page.tsx',
];

console.log('🔍 Checking required files...\n');

let allFilesExist = true;
let missingFiles = [];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allFilesExist = false;
    missingFiles.push(file);
  }
});

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('✅ All required files are present!');
  console.log(`📦 Total files verified: ${requiredFiles.length}`);
  console.log('\n🚀 Ready to run:');
  console.log('   npm install');
  console.log('   npm run dev');
} else {
  console.log('❌ Some files are missing!');
  console.log(`Missing files (${missingFiles.length}):`);
  missingFiles.forEach(file => console.log(`   - ${file}`));
  process.exit(1);
}

console.log('='.repeat(50) + '\n');
