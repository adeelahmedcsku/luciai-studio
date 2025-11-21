use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
