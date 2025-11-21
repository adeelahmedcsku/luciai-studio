# 📦 Installation & Setup Guide

Complete step-by-step guide to get Software Developer Agent IDE running on your machine.

---

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [LLM Setup (Ollama)](#llm-setup-ollama)
5. [First Run](#first-run)
6. [Troubleshooting](#troubleshooting)
7. [Updating](#updating)

---

## 💻 System Requirements

### Minimum:
- **OS:** Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM:** 8 GB (16 GB recommended)
- **Storage:** 20 GB free space
- **CPU:** 4 cores (8 cores recommended for LLM)

### Recommended:
- **RAM:** 32 GB (for large LLM models)
- **GPU:** NVIDIA GPU with 8GB+ VRAM (optional, for faster LLM)
- **Storage:** SSD with 50 GB+ free space

---

## 🔧 Prerequisites Installation

### 1. Node.js (Required)

**Windows & macOS:**
1. Download from [nodejs.org](https://nodejs.org/)
2. Download the LTS version (18.x or higher)
3. Run the installer
4. Verify installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 2. Rust (Required)

**Windows:**
1. Download from [rustup.rs](https://rustup.rs/)
2. Run `rustup-init.exe`
3. Follow the prompts (choose default installation)
4. Restart terminal/command prompt
5. Verify:
```bash
rustc --version  # Should show 1.75.0 or higher
cargo --version
```

**macOS & Linux:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts, then restart terminal
source $HOME/.cargo/env

# Verify
rustc --version
cargo --version
```

### 3. pnpm (Recommended Package Manager)

**All Platforms:**
```bash
npm install -g pnpm

# Verify
pnpm --version  # Should show 8.x.x or higher
```

### 4. System Dependencies

**Windows:**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
- Or install Visual Studio Community with "Desktop development with C++" workload

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Linux (Fedora):**
```bash
sudo dnf install \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel

sudo dnf group install "C Development Tools and Libraries"
```

---

## 🚀 Project Setup

### Step 1: Navigate to Project Directory

```bash
cd software-dev-agent-ide
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# This will take 2-3 minutes
```

**Expected output:**
```
Progress: resolved XXX, reused XXX, downloaded XXX
Packages: +XXX
```

### Step 3: Verify Installation

```bash
# Check if packages installed correctly
pnpm list --depth=0
```

You should see all major dependencies listed.

---

## 🤖 LLM Setup (Ollama)

The IDE uses Ollama to run AI models locally.

### Step 1: Install Ollama

**macOS & Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
1. Download from [ollama.ai](https://ollama.ai/download)
2. Run the installer
3. Ollama will start automatically

### Step 2: Verify Ollama

```bash
# Check if Ollama is running
ollama --version

# Should show: ollama version is 0.x.x
```

### Step 3: Pull a Coding Model

**Recommended Model (Best quality):**
```bash
ollama pull deepseek-coder-v2:33b
# Size: ~18.5 GB
# Time: 10-30 minutes depending on internet
```

**Alternative Lightweight Model:**
```bash
ollama pull starcoder2:15b
# Size: ~8.3 GB
# Faster download, good for testing
```

**Check installed models:**
```bash
ollama list
```

### Step 4: Test the Model

```bash
# Test that the model works
ollama run deepseek-coder-v2:33b "Write a hello world in Python"
```

You should see code output. Press `Ctrl+D` to exit.

---

## 🎯 First Run

### Step 1: Start Development Server

```bash
pnpm tauri dev
```

**⏰ First run takes 5-10 minutes!**
- Rust needs to compile all dependencies
- This only happens once
- Grab a coffee ☕

**Expected output:**
```
   Compiling software-dev-agent-ide v0.1.0
   ...
   Finished dev [unoptimized + debuginfo] target(s) in XXXs
```

### Step 2: Application Launches

You should see:
1. Vite dev server starts on `http://localhost:5173`
2. Terminal shows compilation progress
3. Desktop application window opens
4. Welcome screen appears!

### Step 3: Initial Setup

1. **License Screen:**
   - Click "Skip for now (Development Mode)"
   - Or enter your license key if you have one

2. **Project Dashboard:**
   - You'll see an empty project dashboard
   - Click "New Project" to create your first project

3. **Create Test Project:**
   - Name: `my-first-project`
   - Type: Full-Stack Application
   - Frontend: React
   - Backend: Node.js
   - Database: PostgreSQL
   - Description: "A simple todo app with user authentication"
   - Click through all 4 steps
   - Click "Create Project"

4. **Open IDE:**
   - Your project opens in the IDE workspace
   - See the 3-panel layout
   - Try the Agent chat: "Create a basic Express.js server"

### Step 4: Test Features

**File Explorer:**
- Expand folders
- Click on files
- See file contents

**Code Editor:**
- Select a file
- Edit the code
- Press `Ctrl+S` to save

**Agent Chat:**
- Type a message
- Press Enter to send
- See the response

**Terminal:**
- Click the "Terminal" tab
- Try: `node --version`
- See output

---

## 🐛 Troubleshooting

### Issue: "tauri: command not found"

**Solution:**
```bash
# Install Tauri CLI
cargo install tauri-cli

# Then retry
pnpm tauri dev
```

### Issue: "error: linking with `cc` failed"

**Solution (Linux):**
```bash
# Install build essentials
sudo apt install build-essential

# Retry
pnpm tauri dev
```

### Issue: Port 5173 already in use

**Solution:**
```bash
# Find and kill process using port 5173
# Linux/Mac:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
# Note the PID, then:
taskkill /PID <PID> /F

# Then retry
pnpm tauri dev
```

### Issue: Ollama not connecting

**Check if Ollama is running:**
```bash
# Test connection
curl http://localhost:11434/api/version

# If it fails, start Ollama:
# Mac/Linux:
ollama serve

# Windows:
# Start from Start menu
```

### Issue: "Model not found"

**Solution:**
```bash
# Pull the default model
ollama pull deepseek-coder-v2:33b

# Or change model in Settings
# IDE → Settings → AI Agent → LLM Model
```

### Issue: Rust compilation very slow

**Normal!** First compilation takes 5-10 minutes.

**To speed up subsequent builds:**
```bash
# Use faster linker (Linux)
sudo apt install lld
export RUSTFLAGS="-C link-arg=-fuse-ld=lld"

# Use faster linker (macOS)
brew install llvm
export RUSTFLAGS="-C link-arg=-fuse-ld=lld"
```

### Issue: "WebKit2GTK error" (Linux)

**Solution:**
```bash
# Install webkit
sudo apt install libwebkit2gtk-4.1-dev

# If 4.1 not available, try 4.0:
sudo apt install libwebkit2gtk-4.0-dev
```

### Issue: Application crashes on startup

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules
rm -rf src-tauri/target
pnpm install
pnpm tauri dev
```

### Get More Help

If issues persist:
1. Check the logs in terminal
2. Look for error messages in the app console (`F12`)
3. Search GitHub issues
4. Ask in community chat

---

## 🔄 Updating

### Update Dependencies

```bash
# Update npm packages
pnpm update

# Update Rust dependencies
cd src-tauri
cargo update
cd ..
```

### Update Ollama

```bash
# Download latest Ollama version
# Visit ollama.ai/download

# Update models
ollama pull deepseek-coder-v2:33b
```

### Rebuild Application

```bash
# Clean and rebuild
pnpm tauri build

# Output will be in src-tauri/target/release
```

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Node.js 18+ installed
- [ ] Rust 1.75+ installed  
- [ ] pnpm installed
- [ ] System dependencies installed
- [ ] Project dependencies installed (`pnpm install`)
- [ ] Ollama installed and running
- [ ] At least one model downloaded
- [ ] Application launches (`pnpm tauri dev`)
- [ ] Can create a project
- [ ] Can open IDE workspace
- [ ] Agent responds to messages
- [ ] Terminal executes commands

---

## 🎊 Success!

If all checks pass, you're ready to start building with the IDE!

**Next Steps:**
1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for usage
2. Try creating a real project
3. Experiment with the AI agent
4. Build something amazing!

---

## 📚 Additional Resources

- **Tauri Docs:** https://tauri.app/
- **Ollama Docs:** https://ollama.ai/
- **Rust Book:** https://doc.rust-lang.org/book/
- **React Docs:** https://react.dev/

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or ask in our community!

**Ready to Build!** 🚀
