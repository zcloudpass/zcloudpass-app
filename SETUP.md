# zCloudPass - Setup & Build Guide

A secure, encrypted password vault desktop app built with Tauri, React, and TypeScript, featuring biometric authentication and automatic clipboard clearing.

## ✅ What's Been Completed

### Backend (Rust/Tauri)
- **Biometric Authentication**: Windows Hello integration via `tauri-plugin-biometric`
- **Clipboard Management**: Auto-clear clipboard after 10 seconds via `tauri-plugin-clipboard-manager`
- **Plugin Integration**: All necessary Tauri plugins configured in `src-tauri/Cargo.toml`

### Frontend (React/TypeScript)
- **Login Component**: Email + master password login with biometric unlock button
- **Vault Component**: View, add, edit, delete password entries
- **Password Generator**: Generate strong random passwords
- **Settings Component**: User account and app settings
- **API Integration**: Backend communication with encrypted vault storage
- **UI Framework**: Full Tailwind CSS + Radix UI component library
- **Responsive Design**: Mobile-friendly with dark/light theme support

### Project Configuration
- **Build System**: Vite (ultra-fast bundler)
- **Testing**: Vitest with coverage support
- **Icons**: All required icon assets present (32x32, 128x128, 256x256, .ico, .icns)
- **Environment**: Support for different backend URLs via `.env` file

## 🔧 System Requirements

### For Development

1. **Node.js & npm**: 18+ recommended
   - ✅ Already satisfied (npm install completed)

2. **Rust Toolchain**: 1.77.2+
   - Get from: https://www.rust-lang.org/tools/install

3. **MSVC Build Tools** ⚠️ **REQUIRED FOR TAURI ON WINDOWS**
   - Download: https://visualstudio.microsoft.com/downloads/
   - Choose either:
     - **"Build Tools for Visual Studio 2022"** (minimal, ~10GB)
     - **"Visual Studio Community"** (full IDE, ~20GB)
   - During installation, **MUST select "Desktop development with C++"**
   - This provides the MSVC linker (`link.exe`) needed by Tauri

4. **WebView2** (Usually auto-installed with Visual Studio)
   - If needed: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## 📦 Installation Steps

### Step 1: Install MSVC Build Tools

1. Download from: https://visualstudio.microsoft.com/downloads/
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. Click "Install" and wait for completion (~15-30 min depending on connection)
5. Restart your computer

### Step 2: Verify Installation

```powershell
# Check if MSVC linker is available
where link.exe

# Should output path like:
# C:\Program Files\Microsoft Visual Studio\2022\...\VC\Tools\MSVC\...\bin\Hostx86\x64\link.exe
```

### Step 3: Build the Application

```powershell
cd c:\Users\chait\Downloads\zcloudpass-app\zcloudpass-app

# Build Rust backend + React frontend
npm run tauri:build

# Or for development with hot reload
npm run tauri:dev
```

## 🚀 Running the App

### Development Mode (with hot reload)
```powershell
npm run tauri:dev
```
- Frontend auto-rebuilds on file changes
- Rust backend reloads automatically
- Dev tools available (DevTools + Console)

### Production Build
```powershell
npm run tauri:build
```
- Creates optimized executable in `src-tauri/target/release/`
- Installer will be in `src-tauri/target/release/bundle/`

## 🔐 Features

### 1. Biometric Unlock
- Windows Hello (fingerprint, face recognition)
- Appears as first option on login screen if available
- Fallback to master password always available

### 2. Secure Password Storage
- AES-256-GCM encryption
- Argon2 key derivation (PBKDF2 alternative)
- Encrypted locally and synced to backend

### 3. Automatic Clipboard Clear
- When you copy a password, it automatically clears after 10 seconds
- Prevents accidental paste of sensitive data
- Notification in Tauri status bar

### 4. Password Generator
- Customizable length and character types
- One-click generation while creating entries
- Strength indicator

### 5. Vault Management
- Add, edit, delete password entries
- Organize by account name, username, URL
- Search functionality
- Favicon display for websites

## 📁 Project Structure

```
├── src/                          # React frontend
│   ├── components/               # React components
│   │   ├── Login.tsx            # Biometric + password login
│   │   ├── Vault.tsx            # Main vault view
│   │   ├── Passwordgenerator.tsx
│   │   └── ui/                  # Radix UI components
│   ├── lib/
│   │   ├── api.ts               # Backend API + Tauri integration
│   │   └── crypto.ts            # Encryption/decryption
│   ├── App.tsx                  # Main app component
│   └── index.css                # Global styles
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   └── lib.rs               # Tauri command handlers
│   ├── Cargo.toml               # Rust dependencies + plugins
│   ├── tauri.conf.json          # Tauri configuration
│   └── icons/                   # App icons
│
├── package.json                 # npm scripts + dependencies
├── vite.config.ts              # Vite bundler config
├── tsconfig.json               # TypeScript config
└── .env.production             # Backend URL
```

## 🔌 API Integration

### Backend URL Configuration

Update `.env.production` to point to your backend:
```
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

### Available Endpoints

The app expects these endpoints from your backend:
- `POST /auth/register` - User registration
- `POST /auth/login` - Login (returns session token)
- `GET /vault` - Fetch encrypted vault
- `PUT /vault` - Update encrypted vault
- `POST /auth/change-password` - Change master password

## 🧪 Testing

```powershell
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Open coverage report
start coverage/index.html
```

## 🐛 Troubleshooting

### "link.exe not found"
- **Cause**: MSVC Build Tools not installed
- **Solution**: Follow Step 1 in Installation Steps above

### "cargo: command not found"
- **Cause**: Rust not installed
- **Solution**: Install from https://www.rust-lang.org/tools/install

### "Biometric not working"
- **Platform Support**: Windows 10+ with Windows Hello enabled
- **Verification**: 
  ```powershell
  Settings > Accounts > Sign-in options > Check for Windows Hello
  ```

### "Clipboard not clearing"
- **Note**: Clipboard clearing happens on the desktop app
- **Fallback**: Manual Ctrl+X clears it immediately after copy

### TypeScript errors in IDE
- Run: `npm install`
- Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

## 📝 Environment Variables

Create `.env.development` for local testing:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Create `.env.production` for production build:
```
VITE_API_BASE_URL=https://zcloudpass-backend.onrender.com/api/v1
```

## 🔒 Security Notes

1. Master password is hashed with Argon2 before transmission
2. Vault is encrypted client-side with AES-256-GCM
3. Session tokens expire after configured period
4. Biometric is hardware-backed (Windows Hello)
5. Clipboard auto-clears to prevent accidental leaks

## 📦 Build Output

After `npm run tauri:build`:
- **Windows Installer**: `src-tauri/target/release/bundle/msi/`
- **Portable EXE**: `src-tauri/target/release/`
- **Size**: ~50-70MB depending on system libraries

## 🤝 Development Workflow

1. **Frontend changes**: Edit `src/components/*.tsx` → auto-reload
2. **Backend changes**: Edit `src-tauri/src/*.rs` → restart dev server
3. **Config changes**: Edit `tauri.conf.json` or `Cargo.toml` → rebuild

```powershell
# Watch for changes
npm run tauri:dev

# In another terminal for Rust changes
cd src-tauri && cargo watch -x build
```

## 📞 Next Steps

1. ✅ Install MSVC Build Tools (see Step 1 above)
2. ✅ Run `npm run tauri:dev` to start development
3. ✅ Test biometric login with your fingerprint/face
4. ✅ Copy a password and watch it clear after 10 seconds
5. ✅ Build release version with `npm run tauri:build`

## 📋 Checklist for Production Deployment

- [ ] Set backend URL in `.env.production`
- [ ] Update app version in `src-tauri/tauri.conf.json`
- [ ] Create `.env.production` with production backend URL
- [ ] Run `npm run tauri:build`
- [ ] Sign executable with code signing certificate (optional but recommended)
- [ ] Test installer on clean Windows machine
- [ ] Collect installer `.msi` from `src-tauri/target/release/bundle/`

---

**Happy secure password managing! 🔐**
