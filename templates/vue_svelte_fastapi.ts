// Vue 3 Admin Panel Template
export const vueAdminTemplate = {
  id: "vue-admin",
  name: "Vue 3 Admin Panel",
  description: "Admin dashboard built with Vue 3 and Composition API",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["vue", "typescript", "admin", "dashboard"],
  
  structure: {
    "src/App.vue": `<template>
  <div id="app" class="admin-panel">
    <Sidebar />
    <div class="main-content">
      <Header />
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
</script>

<style>
.admin-panel {
  display: flex;
  height: 100vh;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>`,

    "src/components/Dashboard.vue": `<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :trend="stat.trend"
      />
    </div>
    <div class="charts">
      <LineChart :data="chartData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StatCard from './StatCard.vue'
import LineChart from './LineChart.vue'

const stats = ref([
  { title: 'Total Users', value: '1,234', icon: 'users', trend: '+12%' },
  { title: 'Revenue', value: '$45,678', icon: 'dollar', trend: '+8%' },
  { title: 'Orders', value: '890', icon: 'shopping', trend: '+23%' },
  { title: 'Active', value: '567', icon: 'activity', trend: '+5%' },
])

const chartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Sales',
    data: [12, 19, 3, 5, 2, 3]
  }]
})
</script>`,

    "package.json": `{
  "name": "vue-admin",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}`,

    "README.md": `# Vue 3 Admin Panel

Modern admin dashboard with Vue 3.

## Features
- Vue 3 Composition API
- TypeScript
- Vite
- Responsive design
- Charts & stats

## Run
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// Svelte Todo Template
export const svelteTodoTemplate = {
  id: "svelte-todo",
  name: "Svelte Todo App",
  description: "Lightweight todo app built with Svelte",
  category: "Web App",
  difficulty: "Beginner",
  tags: ["svelte", "javascript", "web"],
  
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
      saveTodos();
    }
  }
  
  function toggleTodo(id) {
    todos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
  }
  
  function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
  }
  
  function saveTodos() {
    localStorage.setItem('svelte-todos', JSON.stringify(todos));
  }
  
  // Load on mount
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('svelte-todos');
    if (saved) todos = JSON.parse(saved);
  }
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
    {#each todos as todo}
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
    <p>Total: {todos.length} | Active: {todos.filter(t => !t.completed).length}</p>
  </div>
</main>

<style>
  main {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
  }
  
  h1 {
    text-align: center;
    color: #333;
  }
  
  .add-todo {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  
  .todo-item.completed span {
    text-decoration: line-through;
    color: #999;
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

Lightweight todo application.

## Run
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// FastAPI Backend Template
export const fastApiTemplate = {
  id: "fastapi-backend",
  name: "FastAPI REST API",
  description: "Modern REST API built with FastAPI and async Python",
  category: "Backend",
  difficulty: "Intermediate",
  tags: ["python", "fastapi", "rest", "async"],
  
  structure: {
    "main.py": `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn

app = FastAPI(title="FastAPI Backend", version="1.0.0")

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
    description: Optional[str] = None
    completed: bool = False
    created_at: datetime

# In-memory database
todos_db: List[Todo] = []
next_id = 1

# Endpoints
@app.get("/")
async def root():
    return {"message": "FastAPI Backend", "docs": "/docs"}

@app.get("/todos", response_model=List[Todo])
async def get_todos():
    return todos_db

@app.post("/todos", response_model=Todo)
async def create_todo(todo: TodoCreate):
    global next_id
    new_todo = Todo(
        id=next_id,
        title=todo.title,
        description=todo.description,
        created_at=datetime.now()
    )
    todos_db.append(new_todo)
    next_id += 1
    return new_todo

@app.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: int):
    todo = next((t for t in todos_db if t.id == todo_id), None)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: int, todo: TodoCreate):
    existing = next((t for t in todos_db if t.id == todo_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Todo not found")
    existing.title = todo.title
    existing.description = todo.description
    return existing

@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int):
    global todos_db
    todos_db = [t for t in todos_db if t.id != todo_id]
    return {"message": "Todo deleted"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`,

    "requirements.txt": `fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-multipart==0.0.6`,

    "README.md": `# FastAPI REST API

Modern async REST API.

## Setup
\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`

## API Docs
Visit http://localhost:8000/docs

## Endpoints
- GET /todos - List all
- POST /todos - Create
- GET /todos/{id} - Get one
- PUT /todos/{id} - Update
- DELETE /todos/{id} - Delete
`
  }
};
