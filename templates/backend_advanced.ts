// Template 27: Go REST API
export const goApiTemplate = {
  id: "go-rest-api",
  name: "Go REST API",
  description: "High-performance REST API with Go and Gin framework",
  category: "Backend",
  difficulty: "Intermediate",
  tags: ["go", "golang", "rest", "api", "gin"],
  
  structure: {
    "main.go": `package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Todo struct {
	ID        int       \`json:"id"\`
	Title     string    \`json:"title" binding:"required"\`
	Completed bool      \`json:"completed"\`
	CreatedAt time.Time \`json:"created_at"\`
}

var todos = []Todo{}
var nextID = 1

func main() {
	router := gin.Default()
	
	// Enable CORS
	router.Use(corsMiddleware())
	
	// Routes
	router.GET("/", getRoot)
	router.GET("/todos", getTodos)
	router.GET("/todos/:id", getTodo)
	router.POST("/todos", createTodo)
	router.PUT("/todos/:id", updateTodo)
	router.DELETE("/todos/:id", deleteTodo)
	
	router.Run(":8080")
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}

func getRoot(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Go REST API",
		"version": "1.0.0",
	})
}

func getTodos(c *gin.Context) {
	c.JSON(http.StatusOK, todos)
}

func getTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	for _, todo := range todos {
		if todo.ID == id {
			c.JSON(http.StatusOK, todo)
			return
		}
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
}

func createTodo(c *gin.Context) {
	var newTodo Todo
	
	if err := c.ShouldBindJSON(&newTodo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	newTodo.ID = nextID
	nextID++
	newTodo.CreatedAt = time.Now()
	newTodo.Completed = false
	
	todos = append(todos, newTodo)
	c.JSON(http.StatusCreated, newTodo)
}

func updateTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var updatedTodo Todo
	if err := c.ShouldBindJSON(&updatedTodo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	for i, todo := range todos {
		if todo.ID == id {
			todos[i].Title = updatedTodo.Title
			todos[i].Completed = updatedTodo.Completed
			c.JSON(http.StatusOK, todos[i])
			return
		}
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
}

func deleteTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	for i, todo := range todos {
		if todo.ID == id {
			todos = append(todos[:i], todos[i+1:]...)
			c.Status(http.StatusNoContent)
			return
		}
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
}`,

    "go.mod": `module go-rest-api

go 1.21

require github.com/gin-gonic/gin v1.9.1`,

    "README.md": `# Go REST API

High-performance REST API built with Go and Gin.

## Features
- Fast HTTP server
- RESTful endpoints
- JSON validation
- CORS enabled
- Middleware support

## Development
\`\`\`bash
go mod download
go run main.go
\`\`\`

## API Endpoints
- GET / - API info
- GET /todos - List all todos
- GET /todos/:id - Get one todo
- POST /todos - Create todo
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo

Server runs on http://localhost:8080
`
  }
};

// Template 28: Rust Web Server
export const rustWebTemplate = {
  id: "rust-web-server",
  name: "Rust Web Server",
  description: "Fast and safe web server with Actix-web",
  category: "Backend",
  difficulty: "Advanced",
  tags: ["rust", "actix", "web", "async"],
  
  structure: {
    "src/main.rs": `use actix_web::{get, post, put, delete, web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    id: u32,
    title: String,
    completed: bool,
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct CreateTodo {
    title: String,
}

struct AppState {
    todos: Mutex<Vec<Todo>>,
    next_id: Mutex<u32>,
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Rust Web Server",
        "version": "1.0.0"
    }))
}

#[get("/todos")]
async fn get_todos(data: web::Data<AppState>) -> impl Responder {
    let todos = data.todos.lock().unwrap();
    HttpResponse::Ok().json(&*todos)
}

#[get("/todos/{id}")]
async fn get_todo(
    data: web::Data<AppState>,
    id: web::Path<u32>,
) -> impl Responder {
    let todos = data.todos.lock().unwrap();
    
    match todos.iter().find(|t| t.id == *id) {
        Some(todo) => HttpResponse::Ok().json(todo),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        })),
    }
}

#[post("/todos")]
async fn create_todo(
    data: web::Data<AppState>,
    todo: web::Json<CreateTodo>,
) -> impl Responder {
    let mut todos = data.todos.lock().unwrap();
    let mut next_id = data.next_id.lock().unwrap();
    
    let new_todo = Todo {
        id: *next_id,
        title: todo.title.clone(),
        completed: false,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    *next_id += 1;
    todos.push(new_todo.clone());
    
    HttpResponse::Created().json(new_todo)
}

#[put("/todos/{id}")]
async fn update_todo(
    data: web::Data<AppState>,
    id: web::Path<u32>,
    todo: web::Json<Todo>,
) -> impl Responder {
    let mut todos = data.todos.lock().unwrap();
    
    match todos.iter_mut().find(|t| t.id == *id) {
        Some(existing) => {
            existing.title = todo.title.clone();
            existing.completed = todo.completed;
            HttpResponse::Ok().json(existing.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        })),
    }
}

#[delete("/todos/{id}")]
async fn delete_todo(
    data: web::Data<AppState>,
    id: web::Path<u32>,
) -> impl Responder {
    let mut todos = data.todos.lock().unwrap();
    
    if let Some(pos) = todos.iter().position(|t| t.id == *id) {
        todos.remove(pos);
        HttpResponse::NoContent().finish()
    } else {
        HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        }))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        todos: Mutex::new(Vec::new()),
        next_id: Mutex::new(1),
    });
    
    println!("Server running on http://localhost:8080");
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        
        App::new()
            .wrap(cors)
            .app_data(app_state.clone())
            .service(index)
            .service(get_todos)
            .service(get_todo)
            .service(create_todo)
            .service(update_todo)
            .service(delete_todo)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}`,

    "Cargo.toml": `[package]
name = "rust-web-server"
version = "1.0.0"
edition = "2021"

[dependencies]
actix-web = "4.4"
actix-cors = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.35", features = ["full"] }`,

    "README.md": `# Rust Web Server

Fast and safe web server built with Actix-web.

## Features
- Async/await support
- Type-safe routing
- JSON serialization
- CORS enabled
- Memory safe
- High performance

## Development
\`\`\`bash
cargo build
cargo run
\`\`\`

## API Endpoints
- GET / - Server info
- GET /todos - List all todos
- GET /todos/:id - Get one todo
- POST /todos - Create todo
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo

Server runs on http://localhost:8080

## Performance
Rust + Actix provides excellent performance:
- Low memory footprint
- High throughput
- Type safety
- Zero-cost abstractions
`
  }
};
