# 🚀 Deployment Guide - Software Developer Agent IDE

Complete guide for building, packaging, and distributing the IDE.

---

## 📋 Table of Contents
1. [Build Process](#build-process)
2. [Platform-Specific Builds](#platform-specific-builds)
3. [Code Signing](#code-signing)
4. [Distribution](#distribution)
5. [Auto-Updates](#auto-updates)
6. [Release Process](#release-process)

---

## 🔨 Build Process

### Development Build

```bash
# Run in development mode (hot reload)
pnpm tauri dev

# This creates an unoptimized build for development
```

### Production Build

```bash
# Build for production
pnpm tauri build

# Output locations:
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/deb/ or bundle/appimage/
```

### Build Time

**Expected build times:**
- **First build:** 10-15 minutes (Rust compilation)
- **Subsequent builds:** 2-5 minutes (incremental)
- **Clean build:** 8-12 minutes

### Build Requirements

**Disk Space:**
- Development: ~5GB
- Production build: ~10GB
- Final bundle: ~100-200MB

**Memory:**
- Minimum: 8GB RAM
- Recommended: 16GB RAM

---

## 💻 Platform-Specific Builds

### Windows

**Prerequisites:**
- Windows 10 SDK
- Visual Studio Build Tools
- WiX Toolset (for .msi)

**Build Commands:**
```bash
# Build MSI installer
pnpm tauri build

# Build portable exe
pnpm tauri build --target portable
```

**Output:**
- `*.msi` - Windows Installer
- `*.exe` - Portable executable
- Location: `src-tauri/target/release/bundle/msi/`

**Installer Options:**
- Per-user installation
- System-wide installation
- Custom install directory
- Desktop shortcut
- Start menu entry

### macOS

**Prerequisites:**
- Xcode Command Line Tools
- Apple Developer Account (for signing)

**Build Commands:**
```bash
# Build DMG
pnpm tauri build

# Build for both architectures
pnpm tauri build --target universal-apple-darwin
```

**Output:**
- `*.dmg` - Disk Image
- `*.app` - Application Bundle
- Location: `src-tauri/target/release/bundle/dmg/`

**Architecture Support:**
- Intel (x86_64)
- Apple Silicon (aarch64)
- Universal Binary (both)

### Linux

**Prerequisites:**
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Build Commands:**
```bash
# Build DEB package
pnpm tauri build

# Build AppImage
pnpm tauri build --target appimage

# Build both
pnpm tauri build --target deb appimage
```

**Output:**
- `*.deb` - Debian Package
- `*.AppImage` - Portable AppImage
- Location: `src-tauri/target/release/bundle/`

**Supported Distros:**
- Ubuntu 20.04+
- Debian 11+
- Fedora 35+
- Arch Linux (latest)

---

## 🔐 Code Signing

### Why Sign?

- **Trust:** Users know app is authentic
- **Security:** Prevents tampering
- **Smart Screen:** Avoids Windows warnings
- **Gatekeeper:** Required for macOS distribution

### Windows Code Signing

**Get Certificate:**
1. Purchase from: DigiCert, Sectigo, or GlobalSign
2. Cost: $100-300/year
3. Validate identity (1-3 days)

**Sign the Build:**
```bash
# Set environment variables
$env:TAURI_PRIVATE_KEY = "path/to/certificate.pfx"
$env:TAURI_KEY_PASSWORD = "your-password"

# Build (automatically signs)
pnpm tauri build
```

**Update tauri.conf.json:**
```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": "YOUR_THUMBPRINT",
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

### macOS Code Signing

**Get Certificate:**
1. Join Apple Developer Program ($99/year)
2. Create Developer ID certificate
3. Download and install

**Sign the Build:**
```bash
# Set identity
export APPLE_CERTIFICATE_IDENTITY="Developer ID Application: Your Name"

# Build (automatically signs)
pnpm tauri build

# Notarize (required for macOS 10.15+)
xcrun notarytool submit \
  "src-tauri/target/release/bundle/dmg/YourApp.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait
```

**Update tauri.conf.json:**
```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name",
        "providerShortName": "TEAM_ID",
        "entitlements": "path/to/entitlements.plist"
      }
    }
  }
}
```

### Linux Signing

Linux typically doesn't require code signing for distribution.

---

## 📦 Distribution

### Option 1: Direct Download

**Setup:**
1. Host files on website
2. Provide download links
3. Include checksums

**Example:**
```markdown
## Download

- Windows: [Download .msi](https://example.com/app-setup.msi) (150MB)
- macOS: [Download .dmg](https://example.com/app.dmg) (120MB)
- Linux: [Download .deb](https://example.com/app.deb) (100MB)

### Checksums (SHA256)
- Windows: `abc123...`
- macOS: `def456...`
- Linux: `ghi789...`
```

### Option 2: GitHub Releases

**Automated with GitHub Actions:**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm tauri build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

### Option 3: App Stores

**Microsoft Store (Windows):**
1. Create Developer Account ($19 one-time)
2. Prepare store listing
3. Submit app for review
4. Distribution through Store

**Mac App Store:**
1. Apple Developer Program ($99/year)
2. Different entitlements needed
3. Sandbox requirements
4. Review process (1-2 weeks)

**Snap Store (Linux):**
```bash
# Build snap
snapcraft

# Upload to store
snapcraft upload software-dev-agent-ide_0.1.0_amd64.snap
```

### Option 4: Package Managers

**Homebrew (macOS):**
```bash
# Create formula
brew create https://github.com/you/app/releases/download/v0.1.0/app.dmg

# Submit PR to homebrew-cask
```

**Chocolatey (Windows):**
```bash
# Create package
choco new software-dev-agent-ide

# Publish
choco push software-dev-agent-ide.0.1.0.nupkg --source https://push.chocolatey.org/
```

**AUR (Arch Linux):**
Create PKGBUILD and submit to AUR.

---

## 🔄 Auto-Updates

### Setup Tauri Updater

**1. Configure tauri.conf.json:**
```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.example.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

**2. Generate Update Keys:**
```bash
# Generate keypair
pnpm tauri signer generate

# Output:
# Private key: dW50cnVzdGVk... (keep secret!)
# Public key: dW50cnVzdGVk... (add to tauri.conf.json)
```

**3. Sign Updates:**
```bash
# Build update
pnpm tauri build

# Sign
pnpm tauri signer sign \
  src-tauri/target/release/bundle/msi/app-setup.msi \
  --private-key "YOUR_PRIVATE_KEY"
```

**4. Update Server Response:**
```json
{
  "version": "0.2.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2025-10-27T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVk...",
      "url": "https://releases.example.com/app-0.2.0-setup.msi"
    },
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVk...",
      "url": "https://releases.example.com/app-0.2.0.dmg"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVk...",
      "url": "https://releases.example.com/app-0.2.0.AppImage"
    }
  }
}
```

**5. Check for Updates in App:**
```typescript
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';

async function checkForUpdates() {
  const { shouldUpdate, manifest } = await checkUpdate();
  
  if (shouldUpdate) {
    // Show update dialog
    const confirmed = confirm(
      `Version ${manifest.version} is available. Update now?`
    );
    
    if (confirmed) {
      await installUpdate();
      // App will restart
    }
  }
}
```

---

## 📋 Release Process

### Version Numbering

**Semantic Versioning (MAJOR.MINOR.PATCH):**
- **MAJOR:** Breaking changes (1.0.0 → 2.0.0)
- **MINOR:** New features (1.0.0 → 1.1.0)
- **PATCH:** Bug fixes (1.0.0 → 1.0.1)

### Release Checklist

**Pre-Release:**
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Changelog prepared
- [ ] Version bumped in:
  - [ ] package.json
  - [ ] Cargo.toml
  - [ ] tauri.conf.json

**Build:**
- [ ] Clean build environment
- [ ] Build for all platforms
- [ ] Code sign all builds
- [ ] Generate checksums
- [ ] Test installers

**Distribution:**
- [ ] Upload to release server
- [ ] Create GitHub release
- [ ] Update download links
- [ ] Update auto-updater endpoint

**Post-Release:**
- [ ] Announce on social media
- [ ] Update documentation site
- [ ] Monitor for issues
- [ ] Respond to feedback

### Release Notes Template

```markdown
# Version 0.2.0 - November 1, 2025

## 🎉 New Features
- Added Monaco editor integration
- Real-time code generation
- Project templates

## 🐛 Bug Fixes
- Fixed terminal scrolling issue
- Resolved file save race condition
- Corrected theme switching bug

## ⚡ Performance
- 30% faster project loading
- Reduced memory usage
- Improved LLM response time

## 📚 Documentation
- Added video tutorials
- Updated installation guide
- New keyboard shortcuts

## 🔒 Security
- Updated dependencies
- Fixed XSS vulnerability
- Enhanced file permissions

## Download
- [Windows Installer](link)
- [macOS DMG](link)
- [Linux AppImage](link)

Full changelog: [v0.1.0...v0.2.0](link)
```

---

## 🎯 Launch Strategy

### Beta Launch (Months 1-2)
- **Goal:** Test with early adopters
- **Users:** 50-100 beta testers
- **Distribution:** Direct download
- **Feedback:** Active collection
- **Updates:** Weekly

### Public Launch (Month 3)
- **Goal:** General availability
- **Users:** Target 1,000 in Month 1
- **Distribution:** Website + GitHub
- **Price:** €99/year
- **Support:** Email + Discord

### Growth Phase (Months 4-12)
- **Goal:** Reach 10,000 users
- **Distribution:** Add app stores
- **Marketing:** Content, SEO, ads
- **Updates:** Monthly
- **Support:** Expanded team

---

## 📊 Metrics to Track

### Download Metrics:
- Downloads per platform
- Conversion rate (download → install)
- Active installations
- Update adoption rate

### Usage Metrics:
- Daily active users (DAU)
- Monthly active users (MAU)
- Session duration
- Feature usage

### Business Metrics:
- License sales
- Revenue
- Churn rate
- Customer lifetime value

---

## 🔧 Troubleshooting Builds

### "Build failed: linker error"
```bash
# Clean and rebuild
cargo clean
pnpm tauri build
```

### "Code signing failed"
- Verify certificate is valid
- Check password is correct
- Ensure certificate hasn't expired

### "Bundle too large"
- Enable compression in tauri.conf.json
- Remove unused dependencies
- Optimize assets

### "App won't start after build"
- Test in production mode locally first
- Check console for errors
- Verify all assets bundled correctly

---

## 📞 Support

### For Build Issues:
- Check [Tauri Docs](https://tauri.app/)
- Search [GitHub Issues](https://github.com/tauri-apps/tauri/issues)
- Ask in [Tauri Discord](https://discord.gg/tauri)

### For Distribution:
- Platform-specific developer docs
- App store guidelines
- Package manager documentation

---

**Ready to Deploy!** 🚀

Remember: Start small, iterate fast, listen to users! 📈
