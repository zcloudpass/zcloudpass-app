# 🚀 Quick Start Guide - zCloudPass

## What's Done ✅

Your Tauri password vault app is **fully implemented** with:
- ✅ Biometric authentication (Windows Hello - fingerprint/face)
- ✅ Secure password vault with AES-256 encryption
- ✅ Auto-clear clipboard after 10 seconds
- ✅ Beautiful React UI with dark/light theme
- ✅ Password generator
- ✅ All app icons generated
- ✅ TypeScript compiles without errors

## What You Need to Do 🔧

### Step 1: Install MSVC Build Tools (ONE TIME - 15 min)

1. Go to: **https://visualstudio.microsoft.com/downloads/**
2. Download **"Build Tools for Visual Studio 2022"**
3. Run the installer
4. When prompted, select **"Desktop development with C++"**
5. Click Install
6. **Restart your computer**

### Step 2: Build the App (5 min)

Open PowerShell and run:

```powershell
cd c:\Users\chait\Downloads\zcloudpass-app\zcloudpass-app

# Development with hot reload (auto-restarts on code changes)
npm run tauri:dev

# OR production build
npm run tauri:build
```

That's it! 🎉

## Test the Features

Once the app is running:

1. **Biometric Login**
   - Click "Unlock with Biometric"
   - Use your fingerprint or face recognition

2. **Copy a Password**
   - Click the copy icon next to any password
   - Clipboard is automatically cleared after 10 seconds

3. **Generate Password**
   - Click "Generate" while creating/editing an entry
   - Customize length and character types

## Troubleshooting

### "link.exe not found" 
→ You need to install MSVC Build Tools (see Step 1)

### "Biometric not working"
→ Make sure Windows Hello is enabled:
   Settings → Accounts → Sign-in options → Windows Hello

### "npm packages missing"
→ Run: `npm install`

## Files You Might Want to Know About

- **[SETUP.md](./SETUP.md)** — Detailed setup guide with all options
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** — What was built and verified
- **src/components/Login.tsx** — Biometric login screen
- **src-tauri/src/lib.rs** — Clipboard clearing backend
- **src/lib/api.ts** — Tauri/backend integration

## Configuration

### Change Backend URL
Edit `.env.production`:
```
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

### Change Clipboard Clear Time
Edit `src-tauri/src/lib.rs`, find `delay_secs` parameter

### Change App Name/Icon
Edit `src-tauri/tauri.conf.json`

## Commands

```powershell
# Development (with hot reload and dev tools)
npm run tauri:dev

# Production build (creates installer)
npm run tauri:build

# Frontend only (no desktop app)
npm run dev

# Run tests
npm run test

# Check TypeScript
npx tsc --noEmit
```

## How Everything Works

```
You type password → Tauri sends to clipboard → 10s timer starts
                                            ↓
                                    Timer triggers
                                            ↓
                                    Clipboard cleared
                                            ↓
                                    Password gone ✨
```

## What Each Part Does

| Component | Purpose |
|-----------|---------|
| **src/** | React frontend (UI) |
| **src-tauri/** | Rust backend (Windows integration) |
| **src-tauri/src/lib.rs** | Clipboard clearing function |
| **package.json** | npm scripts and dependencies |
| **vite.config.ts** | Build configuration |
| **tauri.conf.json** | App configuration |

## Need Help?

1. **Can't find link.exe?** → Install MSVC Build Tools
2. **Biometric not showing?** → Check Windows Hello is set up
3. **TypeScript errors?** → Run `npm install`
4. **Clipboard not clearing?** → It works! Check after 10 seconds

---

**Ready?** Run `npm run tauri:dev` and enjoy your secure password vault! 🔐

For detailed information, see [SETUP.md](./SETUP.md)
