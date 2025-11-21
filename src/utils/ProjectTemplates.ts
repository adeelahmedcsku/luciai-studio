export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  files: TemplateFile[];
  dependencies?: {
    npm?: string[];
    dev?: string[];
  };
  scripts?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "react-vite",
    name: "React + Vite",
    description: "Modern React app with Vite, TypeScript, and Tailwind CSS",
    type: "frontend",
    icon: "⚛️",
    dependencies: {
      npm: ["react", "react-dom"],
      dev: [
        "@vitejs/plugin-react",
        "vite",
        "typescript",
        "@types/react",
        "@types/react-dom",
        "tailwindcss",
        "postcss",
        "autoprefixer",
      ],
    },
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
    },
    files: [
      {
        path: "package.json",
        content: `{
  "name": "react-vite-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}`,
      },
      {
        path: "tsconfig.json",
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      },
      {
        path: "tailwind.config.js",
        content: `export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      },
      {
        path: "postcss.config.js",
        content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        path: "src/main.tsx",
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      },
      {
        path: "src/App.tsx",
        content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Hello from React + Vite!
        </h1>
        <p className="text-gray-600 mb-6">
          Count: {count}
        </p>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  )
}

export default App`,
      },
      {
        path: "src/index.css",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      },
      {
        path: ".gitignore",
        content: `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules/

# Build
dist/
dist-ssr/
*.local

# Editor
.vscode/
.idea/`,
      },
      {
        path: "README.md",
        content: `# React + Vite App

A modern React application built with Vite and Tailwind CSS.

## Get Started

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\``,
      },
    ],
  },
  {
    id: "express-api",
    name: "Express API",
    description: "RESTful API with Express, TypeScript, and MongoDB",
    type: "backend",
    icon: "🚀",
    dependencies: {
      npm: ["express", "mongoose", "cors", "dotenv"],
      dev: [
        "typescript",
        "@types/express",
        "@types/node",
        "@types/cors",
        "ts-node",
        "nodemon",
      ],
    },
    scripts: {
      dev: "nodemon src/index.ts",
      build: "tsc",
      start: "node dist/index.js",
    },
    files: [
      {
        path: "package.json",
        content: `{
  "name": "express-api",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}`,
      },
      {
        path: "tsconfig.json",
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`,
      },
      {
        path: "src/index.ts",
        content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express API!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`,
      },
      {
        path: ".env",
        content: `PORT=3000
MONGODB_URI=mongodb://localhost:27017/myapp`,
      },
      {
        path: ".gitignore",
        content: `node_modules/
dist/
.env
*.log`,
      },
      {
        path: "README.md",
        content: `# Express API

A RESTful API built with Express and TypeScript.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm start
\`\`\``,
      },
    ],
  },
  {
    id: "nextjs-app",
    name: "Next.js App",
    description: "Full-stack Next.js 14 with App Router and Tailwind",
    type: "fullstack",
    icon: "▲",
    dependencies: {
      npm: ["next", "react", "react-dom"],
      dev: [
        "typescript",
        "@types/react",
        "@types/node",
        "tailwindcss",
        "postcss",
        "autoprefixer",
      ],
    },
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    files: [
      {
        path: "package.json",
        content: `{
  "name": "nextjs-app",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}`,
      },
      {
        path: "tsconfig.json",
        content: `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
      },
      {
        path: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`,
      },
      {
        path: "tailwind.config.ts",
        content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config`,
      },
      {
        path: "app/layout.tsx",
        content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'Created with Next.js 14',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      },
      {
        path: "app/page.tsx",
        content: `export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Next.js!
        </h1>
        <p className="text-gray-600">
          Edit <code className="bg-gray-200 px-2 py-1 rounded">app/page.tsx</code> to get started.
        </p>
      </div>
    </main>
  )
}`,
      },
      {
        path: "app/globals.css",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      },
      {
        path: ".gitignore",
        content: `node_modules/
.next/
out/
.env
*.log`,
      },
      {
        path: "README.md",
        content: `# Next.js App

A full-stack application built with Next.js 14.

## Get Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.`,
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: string): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter((t) => t.type === type);
}
