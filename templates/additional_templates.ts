// Template 19: Vue.js Admin Panel
export const vueAdminTemplate = {
  id: "vue-admin",
  name: "Vue.js Admin Dashboard",
  description: "Admin dashboard with Vue 3 Composition API",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["vue", "typescript", "admin", "dashboard"],
  
  structure: {
    "src/App.vue": `<template>
  <div id="app" class="admin-layout">
    <aside class="sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/users">Users</router-link>
        <router-link to="/settings">Settings</router-link>
      </nav>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 20px;
}
.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>`,

    "src/views/Dashboard.vue": `<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="stats">
      <div class="stat-card">
        <h3>Total Users</h3>
        <p class="number">{{ stats.users }}</p>
      </div>
      <div class="stat-card">
        <h3>Active Sessions</h3>
        <p class="number">{{ stats.sessions }}</p>
      </div>
      <div class="stat-card">
        <h3>Revenue</h3>
        <p class="number">\${{ stats.revenue }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Stats {
  users: number
  sessions: number
  revenue: number
}

const stats = ref<Stats>({
  users: 1234,
  sessions: 567,
  revenue: 89012
})

onMounted(() => {
  // Fetch real stats
})
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.number {
  font-size: 2em;
  font-weight: bold;
  color: #42b983;
}
</style>`,

    "package.json": `{
  "name": "vue-admin-panel",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.4.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}`,

    "README.md": `# Vue.js Admin Dashboard

Modern admin panel built with Vue 3 and TypeScript.

## Features
- Composition API
- TypeScript
- Vite
- Vue Router
- Pinia state management

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// Template 20: Svelte Todo App
export const svelteTodoTemplate = {
  id: "svelte-todo",
  name: "Svelte Todo App",
  description: "Lightweight todo app with Svelte",
  category: "Web App",
  difficulty: "Beginner",
  tags: ["svelte", "javascript", "spa"],
  
  structure: {
    "src/App.svelte": `<script>
  let todos = [];
  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, {
        id: Date.now(),
        text: newTodo,
        completed: false
      }];
      newTodo = '';
    }
  }

  function toggleTodo(id) {
    todos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }

  $: active = todos.filter(t => !t.completed).length;
</script>

<main>
  <h1>Svelte Todo</h1>
  
  <div class="add-todo">
    <input
      bind:value={newTodo}
      on:keypress={(e) => e.key === 'Enter' && addTodo()}
      placeholder="What needs to be done?"
    />
    <button on:click={addTodo}>Add</button>
  </div>

  <div class="todo-list">
    {#each todos as todo (todo.id)}
      <div class="todo-item" class:completed={todo.completed}>
        <input
          type="checkbox"
          checked={todo.completed}
          on:change={() => toggleTodo(todo.id)}
        />
        <span>{todo.text}</span>
        <button on:click={() => deleteTodo(todo.id)}>Delete</button>
      </div>
    {/each}
  </div>

  <div class="stats">
    <p>{active} items left</p>
  </div>
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .todo-item {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  .completed span {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>`,

    "package.json": `{
  "name": "svelte-todo",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^4.2.0",
    "vite": "^5.0.0"
  }
}`,

    "README.md": `# Svelte Todo App

Minimal todo app with Svelte.

## Features
- Reactive state
- Simple syntax
- Fast performance
- Small bundle size

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// Template 21: FastAPI Backend
export const fastapiTemplate = {
  id: "fastapi-api",
  name: "FastAPI REST API",
  description: "Modern Python API with FastAPI",
  category: "Backend",
  difficulty: "Intermediate",
  tags: ["python", "fastapi", "rest", "async"],
  
  structure: {
    "main.py": `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="FastAPI Todo API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None

class Todo(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool = False
    created_at: datetime
    updated_at: datetime

# In-memory storage
todos_db: List[Todo] = []
next_id = 1

@app.get("/")
async def root():
    return {"message": "FastAPI Todo API", "version": "1.0.0"}

@app.get("/todos", response_model=List[Todo])
async def get_todos():
    return todos_db

@app.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: int):
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.post("/todos", response_model=Todo, status_code=201)
async def create_todo(todo: TodoCreate):
    global next_id
    now = datetime.now()
    new_todo = Todo(
        id=next_id,
        title=todo.title,
        description=todo.description,
        completed=False,
        created_at=now,
        updated_at=now
    )
    todos_db.append(new_todo)
    next_id += 1
    return new_todo

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: int, todo: TodoCreate):
    existing = next((t for t in todos_db if t.id == todo_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    existing.title = todo.title
    existing.description = todo.description
    existing.updated_at = datetime.now()
    return existing

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int):
    global todos_db
    todos_db = [t for t in todos_db if t.id != todo_id]
    return None

@app.patch("/todos/{todo_id}/toggle", response_model=Todo)
async def toggle_todo(todo_id: int):
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    todo.completed = not todo.completed
    todo.updated_at = datetime.now()
    return todo

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,

    "requirements.txt": `fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-multipart==0.0.6`,

    "README.md": `# FastAPI REST API

Modern, fast Python API.

## Features
- Async/await support
- Automatic API docs
- Type validation
- High performance
- OpenAPI/Swagger

## Setup
\`\`\`bash
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

## API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints
- GET /todos - List all
- POST /todos - Create
- GET /todos/{id} - Get one
- PUT /todos/{id} - Update
- DELETE /todos/{id} - Delete
- PATCH /todos/{id}/toggle - Toggle completed
`
  }
};
