# Developer Guide - Software Developer Agent IDE

## 📚 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Component Guide](#component-guide)
- [Backend API](#backend-api)
- [Adding Features](#adding-features)
- [Debugging Tips](#debugging-tips)

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Tauri API for system integration

**Backend:**
- Rust with Tauri framework
- Async runtime with Tokio
- SQLite for data storage
- Ollama API for LLM integration

### Communication Flow

```
React Components
      ↓ (invoke)
Tauri Commands
      ↓
Rust Backend Logic
      ↓
System Resources / LLM / Database
```

---

## 📁 Project Structure

```
software-dev-agent-ide/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point & command registration
│   │   ├── agent.rs        # AI agent logic
│   │   ├── llm.rs          # LLM integration (Ollama)
│   │   ├── project.rs      # Project management
│   │   ├── license.rs      # License validation
│   │   └── terminal.rs     # Terminal execution
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
│
├── src/                    # React frontend
│   ├── components/
│   │   ├── ide/            # IDE-specific components
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── ProjectDashboard.tsx
│   │   │   ├── NewProjectModal.tsx
│   │   │   ├── IDEWorkspace.tsx
│   │   │   ├── FileExplorer.tsx
│   │   │   ├── AgentChat.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── editor/         # Editor components
│   │   │   └── SimpleCodeEditor.tsx
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── package.json            # Frontend dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind config
└── vite.config.ts          # Vite build config
```

---

## 🚀 Getting Started

### Prerequisites

Install the required tools:

1. **Node.js 18+**
   ```bash
   node --version  # Check version
   ```

2. **Rust 1.75+**
   ```bash
   rustc --version  # Check version
   ```

3. **pnpm** (recommended)
   ```bash
   npm install -g pnpm
   ```

### Installation

```bash
# Clone or navigate to the project
cd software-dev-agent-ide

# Install frontend dependencies
pnpm install

# Run in development mode
pnpm tauri dev
```

**First run takes 5-10 minutes** due to Rust compilation!

---

## 🔄 Development Workflow

### Daily Development

```bash
# Start development server
pnpm tauri dev

# In another terminal - run frontend only
pnpm dev

# Build for production
pnpm tauri build
```

### Making Changes

**Frontend Changes:**
- Edit files in `src/`
- Hot reload works automatically
- See changes instantly in the app

**Backend Changes:**
- Edit files in `src-tauri/src/`
- Restart `pnpm tauri dev`
- Rust compilation takes 30-60 seconds

### Code Quality

```bash
# Lint frontend
pnpm lint

# Format code
pnpm format

# Type check
tsc --noEmit
```

---

## 🧩 Component Guide

### Creating a New Component

**1. Create the component file:**

```tsx
// src/components/MyComponent.tsx
import { useState } from "react";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-4 border border-border rounded-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Click Me
      </button>
    </div>
  );
}
```

**2. Use the component:**

```tsx
import MyComponent from "./components/MyComponent";

function App() {
  return (
    <MyComponent
      title="Hello"
      onAction={() => console.log("Clicked!")}
    />
  );
}
```

### Styling Guidelines

**Use Tailwind CSS classes:**

```tsx
// Good ✅
<div className="flex items-center space-x-2 p-4 bg-background rounded-lg">

// Avoid ❌
<div style={{ display: 'flex', padding: '16px' }}>
```

**Theme colors:**
- `bg-background` - Main background
- `bg-card` - Card background
- `bg-primary` - Primary brand color
- `text-foreground` - Main text
- `text-muted-foreground` - Secondary text
- `border-border` - Border color

---

## 🔌 Backend API

### Calling Rust from React

**1. Define Rust command:**

```rust
// src-tauri/src/project.rs
#[tauri::command]
pub async fn create_project(name: String) -> Result<Project, String> {
    // Implementation
    Ok(project)
}
```

**2. Register in main.rs:**

```rust
// src-tauri/src/main.rs
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        project::create_project,  // Add your command here
    ])
```

**3. Call from React:**

```tsx
import { invoke } from "@tauri-apps/api/core";

async function handleCreate() {
  try {
    const result = await invoke("create_project", { 
      name: "my-project" 
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Available Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `check_license_status` | - | `LicenseStatus` | Check license validity |
| `activate_license` | `licenseKey`, `certificate` | `void` | Activate license |
| `create_project` | `name`, `projectType`, `techStack`, `description` | `Project` | Create new project |
| `list_projects` | - | `Project[]` | List all projects |
| `open_project` | `projectId` | `ProjectMetadata` | Open project |
| `delete_project` | `projectId` | `void` | Delete project |
| `send_prompt` | `prompt` | `AgentResponse` | Send prompt to agent |
| `check_llm_status` | - | `LLMStatus` | Check LLM status |

---

## ➕ Adding Features

### Adding a New Backend Module

**1. Create module file:**

```rust
// src-tauri/src/my_feature.rs
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct MyData {
    pub value: String,
}

pub struct MyFeature;

impl MyFeature {
    pub fn new() -> Self {
        Self
    }
    
    pub fn do_something(&self) -> Result<MyData> {
        Ok(MyData {
            value: "Hello".to_string(),
        })
    }
}

// Tauri command
#[tauri::command]
pub async fn my_feature_action() -> Result<MyData, String> {
    let feature = MyFeature::new();
    feature.do_something()
        .map_err(|e| e.to_string())
}
```

**2. Add to main.rs:**

```rust
mod my_feature;  // Add at top

.invoke_handler(tauri::generate_handler![
    my_feature::my_feature_action,  // Register command
])
```

### Adding a New Frontend Page

**1. Create page component:**

```tsx
// src/components/MyPage.tsx
export default function MyPage() {
  return (
    <div className="h-screen p-6">
      <h1 className="text-2xl font-bold">My Page</h1>
    </div>
  );
}
```

**2. Add routing logic:**

```tsx
// src/App.tsx
const [currentPage, setCurrentPage] = useState<"main" | "mypage">("main");

if (currentPage === "mypage") {
  return <MyPage />;
}
```

---

## 🐛 Debugging Tips

### Frontend Debugging

**1. Chrome DevTools:**
- Open app
- Press `F12` or `Ctrl+Shift+I`
- Check Console, Network, React DevTools

**2. Console logging:**

```tsx
console.log("Debug:", variable);
console.table(arrayOfObjects);
console.error("Error:", error);
```

**3. React DevTools:**
- Install extension
- Inspect component props and state

### Backend Debugging

**1. Rust logging:**

```rust
use tracing::{info, warn, error, debug};

info!("Starting operation");
debug!("Value: {:?}", my_value);
error!("Something failed: {}", error);
```

**2. View logs:**
- Logs appear in terminal running `pnpm tauri dev`
- Look for `[INFO]`, `[WARN]`, `[ERROR]` lines

**3. Rust error handling:**

```rust
// Good ✅
match result {
    Ok(val) => info!("Success: {:?}", val),
    Err(e) => error!("Failed: {}", e),
}

// Better ✅
let result = operation()
    .context("Failed to perform operation")?;
```

### Common Issues

**Issue: "Command not found"**
```bash
# Solution: Register command in main.rs
.invoke_handler(tauri::generate_handler![
    your_command,
])
```

**Issue: "Type error in TypeScript"**
```bash
# Solution: Check types match between Rust and TypeScript
# Rust: pub struct MyData { pub value: String }
# TS: interface MyData { value: string }
```

**Issue: "Rust won't compile"**
```bash
# Solution: Check Cargo.toml dependencies
cargo clean
cargo build
```

---

## 📝 Best Practices

### Code Organization

1. **One component per file**
2. **Group related files in folders**
3. **Use TypeScript for type safety**
4. **Keep components small and focused**

### Naming Conventions

- **Components:** `PascalCase` (MyComponent.tsx)
- **Functions:** `camelCase` (handleClick)
- **Constants:** `UPPER_SNAKE_CASE` (MAX_SIZE)
- **Types/Interfaces:** `PascalCase` (UserData)

### Performance

1. **Memoize expensive calculations:**
```tsx
const value = useMemo(() => expensiveCalc(), [deps]);
```

2. **Use callbacks for handlers:**
```tsx
const handleClick = useCallback(() => {
  // handler
}, [deps]);
```

3. **Lazy load components:**
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## 🎓 Learning Resources

### Tauri
- Docs: https://tauri.app/
- API: https://tauri.app/v1/api/js/

### React
- Docs: https://react.dev/
- TypeScript: https://www.typescriptlang.org/

### Rust
- Book: https://doc.rust-lang.org/book/
- By Example: https://doc.rust-lang.org/rust-by-example/

### Tailwind CSS
- Docs: https://tailwindcss.com/docs

---

## 🤝 Contributing

When adding features:

1. **Test locally** - Verify it works
2. **Update docs** - Add to this guide
3. **Follow patterns** - Match existing code style
4. **Comment complex logic** - Help future developers

---

## 📞 Getting Help

If stuck:

1. Check this guide
2. Read error messages carefully
3. Search GitHub issues
4. Ask in development chat

---

**Happy Coding! 🚀**
