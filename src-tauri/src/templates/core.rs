use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{Manager, Emitter};
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use crate::templates::cache::TemplateCache;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: TemplateCategory,
    pub tech_stack: Vec<String>,
    pub features: Vec<String>,
    pub difficulty: Difficulty,
    pub estimated_files: usize,
    pub thumbnail: Option<String>,
    pub prompt: String, // Pre-filled prompt for this template
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TemplateCategory {
    Web,
    Mobile,
    Desktop,
    CLI,
    API,
    FullStack,
    DataScience,
    GameDev,
    Blockchain,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Difficulty {
    Beginner,
    Intermediate,
    Advanced,
}

pub struct TemplateLibrary {
    templates: HashMap<String, ProjectTemplate>,
}

impl TemplateLibrary {
    pub fn new() -> Self {
        let mut library = Self {
            templates: HashMap::new(),
        };
        library.initialize_default_templates();
        library
    }
    
    fn initialize_default_templates(&mut self) {
        // Web Development Templates
        self.add_template(ProjectTemplate {
            id: "react-todo-app".to_string(),
            name: "React Todo App".to_string(),
            description: "A simple todo list application with local storage".to_string(),
            category: TemplateCategory::Web,
            tech_stack: vec!["React".to_string(), "TypeScript".to_string(), "Tailwind CSS".to_string()],
            features: vec![
                "Add/remove todos".to_string(),
                "Mark as complete".to_string(),
                "Filter by status".to_string(),
                "Persist with localStorage".to_string(),
            ],
            difficulty: Difficulty::Beginner,
            estimated_files: 8,
            thumbnail: None,
            prompt: "Create a todo list app with React and TypeScript. Include add, remove, and complete functionality. Use Tailwind for styling and localStorage for persistence.".to_string(),
        });
        
        self.add_template(ProjectTemplate {
            id: "react-dashboard".to_string(),
            name: "React Dashboard".to_string(),
            description: "Analytics dashboard with charts and data tables".to_string(),
            category: TemplateCategory::Web,
            tech_stack: vec!["React".to_string(), "TypeScript".to_string(), "Chart.js".to_string(), "Tailwind CSS".to_string()],
            features: vec![
                "Data visualization with charts".to_string(),
                "Responsive data tables".to_string(),
                "Filter and search".to_string(),
                "Export to CSV".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 15,
            thumbnail: None,
            prompt: "Create an analytics dashboard with React and TypeScript. Include charts using Chart.js, data tables, filters, and CSV export functionality.".to_string(),
        });
        
        self.add_template(ProjectTemplate {
            id: "ecommerce-store".to_string(),
            name: "E-Commerce Store".to_string(),
            description: "Full-featured online store with cart and checkout".to_string(),
            category: TemplateCategory::FullStack,
            tech_stack: vec!["React".to_string(), "Node.js".to_string(), "Express".to_string(), "MongoDB".to_string(), "Stripe".to_string()],
            features: vec![
                "Product catalog".to_string(),
                "Shopping cart".to_string(),
                "User authentication".to_string(),
                "Payment processing".to_string(),
                "Order management".to_string(),
            ],
            difficulty: Difficulty::Advanced,
            estimated_files: 35,
            thumbnail: None,
            prompt: "Create a full-stack e-commerce store with React frontend and Node.js/Express backend. Include product catalog, shopping cart, user auth, and Stripe payment integration.".to_string(),
        });
        
        // API Templates
        self.add_template(ProjectTemplate {
            id: "rest-api-basic".to_string(),
            name: "REST API (Basic)".to_string(),
            description: "Simple REST API with CRUD operations".to_string(),
            category: TemplateCategory::API,
            tech_stack: vec!["Node.js".to_string(), "Express".to_string(), "SQLite".to_string()],
            features: vec![
                "CRUD endpoints".to_string(),
                "Input validation".to_string(),
                "Error handling".to_string(),
                "Basic authentication".to_string(),
            ],
            difficulty: Difficulty::Beginner,
            estimated_files: 10,
            thumbnail: None,
            prompt: "Create a REST API with Node.js and Express. Include CRUD endpoints for a resource, input validation, error handling, and basic authentication.".to_string(),
        });
        
        self.add_template(ProjectTemplate {
            id: "graphql-api".to_string(),
            name: "GraphQL API".to_string(),
            description: "GraphQL API with Apollo Server".to_string(),
            category: TemplateCategory::API,
            tech_stack: vec!["Node.js".to_string(), "Apollo Server".to_string(), "MongoDB".to_string()],
            features: vec![
                "GraphQL schema".to_string(),
                "Queries and mutations".to_string(),
                "Authentication with JWT".to_string(),
                "Data loaders".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 15,
            thumbnail: None,
            prompt: "Create a GraphQL API using Apollo Server and Node.js. Include schema definition, queries, mutations, JWT authentication, and data loaders for efficiency.".to_string(),
        });
        
        // CLI Templates
        self.add_template(ProjectTemplate {
            id: "cli-tool-basic".to_string(),
            name: "CLI Tool (Basic)".to_string(),
            description: "Command-line utility with argument parsing".to_string(),
            category: TemplateCategory::CLI,
            tech_stack: vec!["Node.js".to_string(), "Commander.js".to_string()],
            features: vec![
                "Command parsing".to_string(),
                "Help documentation".to_string(),
                "Colorized output".to_string(),
                "Configuration file support".to_string(),
            ],
            difficulty: Difficulty::Beginner,
            estimated_files: 6,
            thumbnail: None,
            prompt: "Create a CLI tool with Node.js using Commander.js. Include command parsing, help docs, colored output, and config file support.".to_string(),
        });
        
        // Mobile Templates
        self.add_template(ProjectTemplate {
            id: "react-native-app".to_string(),
            name: "React Native App".to_string(),
            description: "Cross-platform mobile app".to_string(),
            category: TemplateCategory::Mobile,
            tech_stack: vec!["React Native".to_string(), "TypeScript".to_string(), "React Navigation".to_string()],
            features: vec![
                "Navigation between screens".to_string(),
                "Local data persistence".to_string(),
                "API integration".to_string(),
                "Push notifications".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 20,
            thumbnail: None,
            prompt: "Create a React Native mobile app with TypeScript. Include navigation, local storage, API calls, and push notification support.".to_string(),
        });
        
        // Python Templates
        self.add_template(ProjectTemplate {
            id: "flask-api".to_string(),
            name: "Flask REST API".to_string(),
            description: "Python REST API with Flask".to_string(),
            category: TemplateCategory::API,
            tech_stack: vec!["Python".to_string(), "Flask".to_string(), "SQLAlchemy".to_string()],
            features: vec![
                "RESTful endpoints".to_string(),
                "Database ORM".to_string(),
                "Input validation".to_string(),
                "JWT authentication".to_string(),
            ],
            difficulty: Difficulty::Beginner,
            estimated_files: 12,
            thumbnail: None,
            prompt: "Create a REST API with Flask and Python. Include RESTful endpoints, SQLAlchemy ORM, input validation, and JWT authentication.".to_string(),
        });
        
        self.add_template(ProjectTemplate {
            id: "data-analysis-notebook".to_string(),
            name: "Data Analysis Project".to_string(),
            description: "Data analysis with Pandas and visualization".to_string(),
            category: TemplateCategory::DataScience,
            tech_stack: vec!["Python".to_string(), "Pandas".to_string(), "Matplotlib".to_string(), "Jupyter".to_string()],
            features: vec![
                "Data loading and cleaning".to_string(),
                "Statistical analysis".to_string(),
                "Data visualization".to_string(),
                "Report generation".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 8,
            thumbnail: None,
            prompt: "Create a data analysis project with Python, Pandas, and Matplotlib. Include data loading, cleaning, statistical analysis, and visualizations.".to_string(),
        });
        
        // Desktop Templates
        self.add_template(ProjectTemplate {
            id: "electron-app".to_string(),
            name: "Electron Desktop App".to_string(),
            description: "Cross-platform desktop application".to_string(),
            category: TemplateCategory::Desktop,
            tech_stack: vec!["Electron".to_string(), "React".to_string(), "TypeScript".to_string()],
            features: vec![
                "Native menus".to_string(),
                "File system access".to_string(),
                "System tray integration".to_string(),
                "Auto-updates".to_string(),
            ],
            difficulty: Difficulty::Advanced,
            estimated_files: 25,
            thumbnail: None,
            prompt: "Create an Electron desktop app with React and TypeScript. Include native menus, file system access, system tray, and auto-update functionality.".to_string(),
        });
        
        // Additional Templates
        self.add_template(ProjectTemplate {
            id: "next-js-blog".to_string(),
            name: "Next.js Blog".to_string(),
            description: "Static blog with Next.js and MDX".to_string(),
            category: TemplateCategory::Web,
            tech_stack: vec!["Next.js".to_string(), "React".to_string(), "MDX".to_string(), "Tailwind CSS".to_string()],
            features: vec![
                "Static site generation".to_string(),
                "MDX blog posts".to_string(),
                "SEO optimization".to_string(),
                "RSS feed".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 18,
            thumbnail: None,
            prompt: "Create a blog with Next.js using MDX for posts. Include SSG, SEO optimization, Tailwind styling, and RSS feed generation.".to_string(),
        });
        
        self.add_template(ProjectTemplate {
            id: "vue-admin-panel".to_string(),
            name: "Vue.js Admin Panel".to_string(),
            description: "Admin dashboard with Vue.js".to_string(),
            category: TemplateCategory::Web,
            tech_stack: vec!["Vue.js".to_string(), "TypeScript".to_string(), "Vuetify".to_string()],
            features: vec![
                "User management".to_string(),
                "Role-based access".to_string(),
                "Data tables".to_string(),
                "Charts and analytics".to_string(),
            ],
            difficulty: Difficulty::Intermediate,
            estimated_files: 22,
            thumbnail: None,
            prompt: "Create an admin panel with Vue.js and Vuetify. Include user management, role-based access control, data tables, and analytics charts.".to_string(),
        });
    }
    
    pub fn add_template(&mut self, template: ProjectTemplate) {
        self.templates.insert(template.id.clone(), template);
    }
    
    pub fn get_template(&self, id: &str) -> Option<&ProjectTemplate> {
        self.templates.get(id)
    }
    
    pub fn list_templates(&self) -> Vec<&ProjectTemplate> {
        self.templates.values().collect()
    }
    
    pub fn list_by_category(&self, category: &TemplateCategory) -> Vec<&ProjectTemplate> {
        self.templates.values()
            .filter(|t| std::mem::discriminant(&t.category) == std::mem::discriminant(category))
            .collect()
    }
    
    pub fn list_by_difficulty(&self, difficulty: &Difficulty) -> Vec<&ProjectTemplate> {
        self.templates.values()
            .filter(|t| std::mem::discriminant(&t.difficulty) == std::mem::discriminant(difficulty))
            .collect()
    }
    
    pub fn search(&self, query: &str) -> Vec<&ProjectTemplate> {
        let query_lower = query.to_lowercase();
        self.templates.values()
            .filter(|t| {
                t.name.to_lowercase().contains(&query_lower) ||
                t.description.to_lowercase().contains(&query_lower) ||
                t.tech_stack.iter().any(|tech| tech.to_lowercase().contains(&query_lower))
            })
            .collect()
    }
}

// Tauri command
#[tauri::command]
pub async fn list_project_templates() -> Result<Vec<ProjectTemplate>, String> {
    let library = TemplateLibrary::new();
    Ok(library.list_templates().into_iter().cloned().collect())
}

#[tauri::command]
pub async fn get_project_template(template_id: String) -> Result<ProjectTemplate, String> {
    let library = TemplateLibrary::new();
    library.get_template(&template_id)
        .cloned()
        .ok_or_else(|| "Template not found".to_string())
}

#[tauri::command]
pub async fn search_templates(query: String) -> Result<Vec<ProjectTemplate>, String> {
    let library = TemplateLibrary::new();
    Ok(library.search(&query).into_iter().cloned().collect())
}

#[tauri::command]
pub async fn clear_template_cache(app: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut cache = TemplateCache::new(app_data_dir).map_err(|e| e.to_string())?;
    cache.clear().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_template_cache_size(app: tauri::AppHandle) -> Result<u64, String> {
    let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    let cache = TemplateCache::new(app_data_dir).map_err(|e| e.to_string())?;
    Ok(cache.list_cached().iter().map(|t| t.size_bytes).sum())
}

// Tauri command
#[tauri::command]
pub async fn create_project_from_template(
    app: tauri::AppHandle,
    template_id: String,
    project_name: String,
    location: String,
) -> Result<String, String> {
    use std::process::Command;
    use std::path::Path;
    use crate::templates::{TemplateProgress, ProgressStage};
    
    // Emit initial progress
    let _ = app.emit("template-progress", TemplateProgress::initializing("Preparing project..."));
    
    println!("Creating project: {} at {} with template {}", project_name, location, template_id);
    
    let full_path = Path::new(&location).join(&project_name);
    let full_path_str = full_path.to_str().ok_or("Invalid path")?;
    
    println!("Full path: {}", full_path_str);
    
    match template_id.as_str() {
        "react-vite" => {
            app.emit("template-progress", TemplateProgress::downloading(0.1, "Creating project structure...")).ok();
            std::fs::create_dir_all(&full_path)
                .map_err(|e| format!("Failed to create directory: {}", e))?;

            // 1. Create package.json
            let package_json = r#"{
  "name": "vite-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}"#;
            std::fs::write(full_path.join("package.json"), package_json)
                .map_err(|e| format!("Failed to create package.json: {}", e))?;

            // 2. Create tsconfig.json
            let tsconfig = r#"{
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
}"#;
            std::fs::write(full_path.join("tsconfig.json"), tsconfig)
                .map_err(|e| format!("Failed to create tsconfig.json: {}", e))?;

            // 3. Create tsconfig.node.json
            let tsconfig_node = r#"{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}"#;
            std::fs::write(full_path.join("tsconfig.node.json"), tsconfig_node)
                .map_err(|e| format!("Failed to create tsconfig.node.json: {}", e))?;

            // 4. Create vite.config.ts
            let vite_config = r#"import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
"#;
            std::fs::write(full_path.join("vite.config.ts"), vite_config)
                .map_err(|e| format!("Failed to create vite.config.ts: {}", e))?;

            // 5. Create index.html
            let index_html = r#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"#;
            std::fs::write(full_path.join("index.html"), index_html)
                .map_err(|e| format!("Failed to create index.html: {}", e))?;

            // 6. Create src directory and files
            let src_path = full_path.join("src");
            std::fs::create_dir_all(&src_path)
                .map_err(|e| format!("Failed to create src directory: {}", e))?;

            // src/main.tsx
            let main_tsx = r#"import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"#;
            std::fs::write(src_path.join("main.tsx"), main_tsx)
                .map_err(|e| format!("Failed to create src/main.tsx: {}", e))?;

            // src/App.tsx
            let app_tsx = r#"import { useState } from 'react'
import { RocketIcon } from 'lucide-react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <RocketIcon className="w-20 h-20 text-blue-500 animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold">Vite + React</h1>
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors font-medium"
          >
            count is {count}
          </button>
          <p className="mt-4 text-gray-400">
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
"#;
            std::fs::write(src_path.join("App.tsx"), app_tsx)
                .map_err(|e| format!("Failed to create src/App.tsx: {}", e))?;

            // src/index.css (Tailwind directives)
            let index_css = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";
            std::fs::write(src_path.join("index.css"), index_css)
                .map_err(|e| format!("Failed to create src/index.css: {}", e))?;

            // src/vite-env.d.ts
            std::fs::write(src_path.join("vite-env.d.ts"), "/// <reference types=\"vite/client\" />")
                .map_err(|e| format!("Failed to create src/vite-env.d.ts: {}", e))?;

            // 7. Create .gitignore
            let gitignore = "node_modules\ndist\n.env\n.DS_Store\n";
            std::fs::write(full_path.join(".gitignore"), gitignore)
                .map_err(|e| format!("Failed to create .gitignore: {}", e))?;

            // 8. Install dependencies (optional)
            app.emit("template-progress", TemplateProgress::installing(0.8, "Installing dependencies...")).ok();
            let _ = Command::new("cmd")
                .args(&["/C", "npm", "install"])
                .current_dir(&full_path)
                .output();
        }
        "react-nextjs" => {
            app.emit("template-progress", TemplateProgress::downloading(0.2, "Running create-next-app...")).ok();
            let output = Command::new("cmd")
                .args(&["/C", "npx", "create-next-app@latest", &project_name, "--typescript", "--tailwind", "--app", "--no-git"])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Next.js project: {}", e))?;
            
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).to_string());
            }
        }
        "vue-vite" => {
            app.emit("template-progress", TemplateProgress::downloading(0.2, "Creating Vue project...")).ok();
            let output = Command::new("cmd")
                .args(&["/C", "npm", "create", "vite@latest", &project_name, "--", "--template", "vue-ts"])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Vue project: {}", e))?;
            
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).to_string());
            }
        }
        "angular" => {
            app.emit("template-progress", TemplateProgress::downloading(0.2, "Creating Angular project...")).ok();
            let output = Command::new("cmd")
                .args(&["/C", "npx", "@angular/cli@latest", "new", &project_name, "--skip-git"])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Angular project: {}", e))?;
            
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).to_string());
            }
        }
        "node-express" => {
            app.emit("template-progress", TemplateProgress::downloading(0.1, "Creating project structure...")).ok();
            // Create directory
            std::fs::create_dir_all(&full_path)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
            
            // 1. Create package.json
            let package_json = r#"{
  "name": "express-api",
  "version": "1.0.0",
  "description": "Express.js API with TypeScript",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.2"
  }
}"#;
            std::fs::write(full_path.join("package.json"), package_json)
                .map_err(|e| format!("Failed to create package.json: {}", e))?;

            // 2. Create tsconfig.json
            let tsconfig = r#"{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}"#;
            std::fs::write(full_path.join("tsconfig.json"), tsconfig)
                .map_err(|e| format!("Failed to create tsconfig.json: {}", e))?;

            // 3. Create .gitignore
            let gitignore = "node_modules\ndist\n.env\n";
            std::fs::write(full_path.join(".gitignore"), gitignore)
                .map_err(|e| format!("Failed to create .gitignore: {}", e))?;

            // 4. Create README.md
            let readme = format!("# {}\n\nExpress.js API with TypeScript.\n\n## Getting Started\n\n1. Install dependencies:\n   ```bash\n   npm install\n   ```\n\n2. Run development server:\n   ```bash\n   npm run dev\n   ```\n", project_name);
            std::fs::write(full_path.join("README.md"), readme)
                .map_err(|e| format!("Failed to create README.md: {}", e))?;

            // 5. Create src directory and index.ts
            let src_path = full_path.join("src");
            std::fs::create_dir_all(&src_path)
                .map_err(|e| format!("Failed to create src directory: {}", e))?;

            let index_ts = r#"import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to your Express + TypeScript API!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
"#;
            std::fs::write(src_path.join("index.ts"), index_ts)
                .map_err(|e| format!("Failed to create src/index.ts: {}", e))?;

            // 6. Install dependencies (optional, but good for "pre-developed" feel)
            // We'll try to run npm install, but won't fail the whole process if it fails
            // because the user can run it manually.
            app.emit("template-progress", TemplateProgress::installing(0.8, "Installing dependencies...")).ok();
            let _ = Command::new("cmd")
                .args(&["/C", "npm", "install"])
                .current_dir(&full_path)
                .output();
        }
        "springboot" => {
            app.emit("template-progress", TemplateProgress::initializing("Creating Spring Boot project...")).ok();
            println!("Creating Spring Boot project: {} at {}", project_name, location);
            
            // Ensure location directory exists
            std::fs::create_dir_all(&location)
                .map_err(|e| format!("Failed to create location directory: {}", e))?;
            
            // Use Spring Initializr API
            let url = format!(
                "https://start.spring.io/starter.zip?type=maven-project&language=java&baseDir={}&groupId=com.example&artifactId={}&name={}&description=Demo+project&packageName=com.example.{}&packaging=jar&javaVersion=17&dependencies=web,data-jpa",
                project_name, project_name, project_name, project_name
            );
            
            let zip_file = format!("{}.zip", project_name);
            let zip_path = Path::new(&location).join(&zip_file);
            
            println!("Download URL: {}", url);
            println!("Zip file path: {:?}", zip_path);
            
            // Generate cache version from URL hash
            let mut hasher = Sha256::new();
            hasher.update(url.as_bytes());
            let url_hash = BASE64.encode(hasher.finalize());
            let cache_version = format!("v1-{}", url_hash.chars().take(16).collect::<String>());
            
            // Initialize cache
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
            let mut cache = TemplateCache::new(app_data_dir).ok();
            
            // Check cache
            let cached_file = if let Some(cache) = &cache {
                cache.get("springboot", &cache_version)
            } else {
                None
            };
            
            if let Some(path) = cached_file {
                if path.exists() {
                    println!("Using cached template from {:?}", path);
                    app.emit("template-progress", TemplateProgress::downloading(1.0, "Using cached template...")).ok();
                    std::fs::copy(&path, &zip_path)
                        .map_err(|e| format!("Failed to copy cached file: {}", e))?;
                } else {
                    download_springboot(&url, &zip_path, &app)?;
                }
            } else {
                download_springboot(&url, &zip_path, &app)?;
                
                // Store in cache
                if let Some(cache) = &mut cache {
                    let _ = cache.store("springboot".to_string(), cache_version, zip_path.clone());
                }
            }

            app.emit("template-progress", TemplateProgress::extracting(0.6, "Extracting files...")).ok();
            println!("Download successful, extracting...");
            
            #[cfg(target_os = "windows")]
            {
                let unzip_script = format!(
                    "Expand-Archive -Path '{}' -DestinationPath '.' -Force",
                    zip_file
                );

                let output = Command::new("powershell")
                    .args(&["-NoProfile", "-Command", &unzip_script])
                    .current_dir(&location)
                    .output()
                    .map_err(|e| format!("Failed to execute powershell unzip: {}", e))?;

                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("Unzip stderr: {}", stderr);
                    app.emit("template-progress", TemplateProgress::error(format!("Extraction failed: {}", stderr))).ok();
                    return Err(format!("Unzip failed: {}", stderr));
                }
                
                // Cleanup zip
                let _ = Command::new("powershell")
                    .args(&["-NoProfile", "-Command", &format!("Remove-Item '{}'", zip_file)])
                    .current_dir(&location)
                    .output();
            }

            #[cfg(not(target_os = "windows"))]
            {
                // Try unzip first (more common on Linux/Mac)
                let unzip_result = Command::new("unzip")
                    .args(&["-o", &zip_file])
                    .current_dir(&location)
                    .output();
                
                if unzip_result.is_err() || !unzip_result.as_ref().unwrap().status.success() {
                    println!("unzip failed or not available, trying tar...");
                    // Fallback to tar
                    let output = Command::new("tar")
                        .args(&["-xf", &zip_file])
                        .current_dir(&location)
                        .output()
                        .map_err(|e| format!("Failed to unzip: {}", e))?;
                    
                    if !output.status.success() {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        app.emit("template-progress", TemplateProgress::error(format!("Extraction failed: {}", stderr))).ok();
                        return Err(stderr.to_string());
                    }
                }
                
                // Cleanup
                let _ = std::fs::remove_file(Path::new(&location).join(&zip_file));
            }
            
            app.emit("template-progress", TemplateProgress::installing(0.9, "Verifying project structure...")).ok();
            
            // Verify the extracted directory exists
            println!("Verifying extracted project at: {}", full_path_str);
            if !full_path.exists() {
                app.emit("template-progress", TemplateProgress::error("Project directory not found")).ok();
                return Err(format!("Project directory was not created at expected path: {}", full_path_str));
            }
        }
        "fastapi" => {
            app.emit("template-progress", TemplateProgress::downloading(0.1, "Creating project structure...")).ok();
            std::fs::create_dir_all(&full_path)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
            
            // 1. Create requirements.txt
            let requirements = "fastapi>=0.104.0\nuvicorn[standard]>=0.24.0\npydantic>=2.5.0\n";
            std::fs::write(full_path.join("requirements.txt"), requirements)
                .map_err(|e| format!("Failed to create requirements.txt: {}", e))?;

            // 2. Create .gitignore
            let gitignore = "__pycache__/\nvenv/\n.env\n*.pyc\n";
            std::fs::write(full_path.join(".gitignore"), gitignore)
                .map_err(|e| format!("Failed to create .gitignore: {}", e))?;

            // 3. Create README.md
            let readme = format!("# {}\n\nFastAPI project.\n\n## Getting Started\n\n1. Create virtual environment:\n   ```bash\n   python -m venv venv\n   ```\n\n2. Activate virtual environment:\n   - Windows: `venv\\Scripts\\activate`\n   - Unix: `source venv/bin/activate`\n\n3. Install dependencies:\n   ```bash\n   pip install -r requirements.txt\n   ```\n\n4. Run server:\n   ```bash\n   uvicorn app.main:app --reload\n   ```\n", project_name);
            std::fs::write(full_path.join("README.md"), readme)
                .map_err(|e| format!("Failed to create README.md: {}", e))?;

            // 4. Create app directory and main.py
            let app_path = full_path.join("app");
            std::fs::create_dir_all(&app_path)
                .map_err(|e| format!("Failed to create app directory: {}", e))?;

            let main_py = r#"from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="FastAPI App",
    description="A simple FastAPI application",
    version="1.0.0"
)

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None

@app.get("/")
async def root():
    return {"message": "Welcome to your FastAPI application!"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}
"#;
            std::fs::write(app_path.join("main.py"), main_py)
                .map_err(|e| format!("Failed to create app/main.py: {}", e))?;

            // 5. Try to setup venv and install (optional)
            // We attempt this but don't fail hard if python is missing
            app.emit("template-progress", TemplateProgress::installing(0.8, "Setting up virtual environment...")).ok();
            let _ = Command::new("cmd")
                .args(&["/C", "python", "-m", "venv", "venv"])
                .current_dir(&full_path)
                .output();
                
            let _ = Command::new("cmd")
                .args(&["/C", "venv\\Scripts\\pip", "install", "-r", "requirements.txt"])
                .current_dir(&full_path)
                .output();
        }
        "django" => {
            // Install Django
            app.emit("template-progress", TemplateProgress::installing(0.2, "Installing Django...")).ok();
            Command::new("cmd")
                .args(&["/C", "pip", "install", "django"])
                .output()
                .map_err(|e| format!("Failed to install Django: {}", e))?;
            
            // Create Django project
            app.emit("template-progress", TemplateProgress::downloading(0.5, "Creating Django project...")).ok();
            Command::new("cmd")
                .args(&["/C", "django-admin", "startproject", &project_name])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Django project: {}", e))?;
        }
        "rust-actix" => {
            // Create Rust project
            app.emit("template-progress", TemplateProgress::downloading(0.2, "Creating Cargo project...")).ok();
            Command::new("cmd")
                .args(&["/C", "cargo", "new", &project_name])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Rust project: {}", e))?;
            
            // Add actix-web to Cargo.toml
            let cargo_toml_path = full_path.join("Cargo.toml");
            let mut cargo_toml = std::fs::read_to_string(&cargo_toml_path)
                .map_err(|e| format!("Failed to read Cargo.toml: {}", e))?;
            
            cargo_toml.push_str("\nactix-web = \"4.0\"\n");
            
            std::fs::write(&cargo_toml_path, cargo_toml)
                .map_err(|e| format!("Failed to write Cargo.toml: {}", e))?;
        }
        "tauri-react" => {
            app.emit("template-progress", TemplateProgress::downloading(0.2, "Creating Tauri project...")).ok();
            let output = Command::new("cmd")
                .args(&["/C", "npm", "create", "tauri-app@latest", &project_name, "--", "--template", "react-ts"])
                .current_dir(&location)
                .output()
                .map_err(|e| format!("Failed to create Tauri project: {}", e))?;
            
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).to_string());
            }
        }
        _ => return Err(format!("Unknown template: {}", template_id)),
    }
    
    app.emit("template-progress", TemplateProgress::complete("Project created successfully!")).ok();
    println!("Project created successfully at {}", full_path_str);
    Ok(full_path_str.to_string())
}

fn download_springboot(url: &str, zip_path: &std::path::Path, app: &tauri::AppHandle) -> Result<(), String> {
    use crate::templates::network::{retry_with_backoff, RetryConfig};
    use std::process::Command;
    
    app.emit("template-progress", crate::templates::TemplateProgress::downloading(0.2, "Downloading Spring Boot template...")).ok();
    
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell on Windows with retry logic
        let download_script = format!(
            "Invoke-WebRequest -Uri '{}' -OutFile '{}'",
            url, zip_path.to_string_lossy()
        );
        
        println!("Executing PowerShell download with retry...");
        retry_with_backoff(
            || {
                let output = Command::new("powershell")
                    .args(&["-NoProfile", "-Command", &download_script])
                    .output()
                    .map_err(|e| format!("Failed to execute powershell: {}", e))?;

                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("Download attempt failed: {}", stderr);
                    return Err(format!("Download failed: {}", stderr));
                }
                Ok(())
            },
            RetryConfig::default(),
        )?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        println!("Downloading with curl and retry...");
        retry_with_backoff(
            || {
                let output = Command::new("curl")
                    .args(&["-L", "-o", &zip_path.to_string_lossy(), url])
                    .output()
                    .map_err(|e| format!("Failed to execute curl: {}", e))?;
                
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("Curl attempt failed: {}", stderr);
                    return Err(stderr.to_string());
                }
                Ok(())
            },
            RetryConfig::default(),
        )?;
    }
    
    Ok(())
}
