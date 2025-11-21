export const angularTodoTemplate = {
  id: "angular-todo",
  name: "Angular Todo App",
  description: "Todo application built with Angular and TypeScript",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["angular", "typescript", "web", "spa"],
  
  structure: {
    "src/app/app.component.ts": `import { Component } from '@angular/core';
import { Todo } from './models/todo.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Todo App';
  todos: Todo[] = [];
  newTodoText = '';

  addTodo(): void {
    if (this.newTodoText.trim()) {
      const todo: Todo = {
        id: Date.now(),
        text: this.newTodoText,
        completed: false,
        createdAt: new Date()
      };
      this.todos.push(todo);
      this.newTodoText = '';
      this.saveTodos();
    }
  }

  toggleTodo(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
    }
  }

  deleteTodo(id: number): void {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
  }

  private saveTodos(): void {
    localStorage.setItem('angular-todos', JSON.stringify(this.todos));
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('angular-todos');
    if (saved) {
      this.todos = JSON.parse(saved);
    }
  }
}`,

    "src/app/app.component.html": `<div class="container">
  <h1>{{ title }}</h1>
  
  <div class="add-todo">
    <input 
      [(ngModel)]="newTodoText"
      (keyup.enter)="addTodo()"
      placeholder="What needs to be done?"
      class="todo-input"
    />
    <button (click)="addTodo()" class="add-button">Add</button>
  </div>

  <div class="todo-list">
    <div *ngFor="let todo of todos" class="todo-item" [class.completed]="todo.completed">
      <input 
        type="checkbox" 
        [checked]="todo.completed"
        (change)="toggleTodo(todo.id)"
      />
      <span class="todo-text">{{ todo.text }}</span>
      <button (click)="deleteTodo(todo.id)" class="delete-button">Delete</button>
    </div>
  </div>

  <div class="stats">
    <p>Total: {{ todos.length }} | Active: {{ todos.filter(t => !t.completed).length }}</p>
  </div>
</div>`,

    "src/app/models/todo.model.ts": `export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}`,

    "src/app/app.module.ts": `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`,

    "package.json": `{
  "name": "angular-todo",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "typescript": "~5.2.0"
  }
}`,

    "README.md": `# Angular Todo App

A simple todo application built with Angular.

## Features

- Add todos
- Mark as complete
- Delete todos
- LocalStorage persistence
- TypeScript

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

Visit http://localhost:4200
`
  }
};

export const djangoApiTemplate = {
  id: "django-api",
  name: "Django REST API",
  description: "RESTful API built with Django and Django REST Framework",
  category: "Backend",
  difficulty: "Intermediate",
  tags: ["python", "django", "rest", "api"],
  
  structure: {
    "api/models.py": `from django.db import models

class Todo(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title`,

    "api/serializers.py": `from rest_framework import serializers
from .models import Todo

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ['id', 'title', 'description', 'completed', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']`,

    "api/views.py": `from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Todo
from .serializers import TodoSerializer

class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title']

    @action(detail=False, methods=['get'])
    def completed(self, request):
        completed_todos = self.queryset.filter(completed=True)
        serializer = self.get_serializer(completed_todos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_todos = self.queryset.filter(completed=False)
        serializer = self.get_serializer(active_todos, many=True)
        return Response(serializer.data)`,

    "api/urls.py": `from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TodoViewSet

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]`,

    "project/settings.py": `import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-change-this-in-production'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}

CORS_ALLOW_ALL_ORIGINS = True  # Change in production`,

    "requirements.txt": `Django==5.0
djangorestframework==3.14.0
django-cors-headers==4.3.0
python-decouple==3.8`,

    "README.md": `# Django REST API

A RESTful API for managing todos.

## Setup

\`\`\`bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
\`\`\`

## API Endpoints

- GET /api/todos/ - List all todos
- POST /api/todos/ - Create todo
- GET /api/todos/{id}/ - Get todo
- PUT /api/todos/{id}/ - Update todo
- DELETE /api/todos/{id}/ - Delete todo
- GET /api/todos/completed/ - Get completed todos
- GET /api/todos/active/ - Get active todos
`
  }
};

export const flutterAppTemplate = {
  id: "flutter-app",
  name: "Flutter Mobile App",
  description: "Cross-platform mobile app built with Flutter",
  category: "Mobile",
  difficulty: "Intermediate",
  tags: ["flutter", "dart", "mobile", "ios", "android"],
  
  structure: {
    "lib/main.dart": `import 'package:flutter/material.dart';
import 'models/todo.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Todo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const TodoListScreen(),
    );
  }
}

class TodoListScreen extends StatefulWidget {
  const TodoListScreen({Key? key}) : super(key: key);

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen> {
  final List<Todo> _todos = [];
  final TextEditingController _controller = TextEditingController();

  void _addTodo() {
    if (_controller.text.isNotEmpty) {
      setState(() {
        _todos.add(Todo(
          id: DateTime.now().millisecondsSinceEpoch,
          title: _controller.text,
          completed: false,
        ));
        _controller.clear();
      });
    }
  }

  void _toggleTodo(int index) {
    setState(() {
      _todos[index].completed = !_todos[index].completed;
    });
  }

  void _deleteTodo(int index) {
    setState(() {
      _todos.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Todo'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'What needs to be done?',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _addTodo(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addTodo,
                  child: const Text('Add'),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _todos.length,
              itemBuilder: (context, index) {
                final todo = _todos[index];
                return ListTile(
                  leading: Checkbox(
                    value: todo.completed,
                    onChanged: (_) => _toggleTodo(index),
                  ),
                  title: Text(
                    todo.title,
                    style: TextStyle(
                      decoration: todo.completed 
                        ? TextDecoration.lineThrough 
                        : null,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () => _deleteTodo(index),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}`,

    "lib/models/todo.dart": `class Todo {
  final int id;
  final String title;
  bool completed;

  Todo({
    required this.id,
    required this.title,
    required this.completed,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'completed': completed,
    };
  }

  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      id: json['id'],
      title: json['title'],
      completed: json['completed'],
    );
  }
}`,

    "pubspec.yaml": `name: flutter_todo
description: A Flutter todo application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true`,

    "README.md": `# Flutter Todo App

A simple todo application for iOS and Android.

## Getting Started

\`\`\`bash
flutter pub get
flutter run
\`\`\`

## Features

- Add todos
- Mark as complete
- Delete todos
- Material Design
- Cross-platform
`
  }
};

export const electronAppTemplate = {
  id: "electron-app",
  name: "Electron Desktop App",
  description: "Desktop application built with Electron and React",
  category: "Desktop",
  difficulty: "Advanced",
  tags: ["electron", "react", "desktop", "nodejs"],
  
  structure: {
    "main.js": `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});`,

    "src/App.tsx": `import React, { useState } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: input,
        completed: false
      }]);
      setInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="App">
      <h1>Electron Todo App</h1>
      <div className="add-todo">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`,

    "package.json": `{
  "name": "electron-todo",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "electron": "electron .",
    "electron-dev": "concurrently \\"npm start\\" \\"wait-on http://localhost:3000 && electron .\\"",
    "electron-pack": "electron-builder"
  },
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "react-scripts": "^5.0.1",
    "electron-builder": "^24.9.0",
    "concurrently": "^8.2.0",
    "wait-on": "^7.2.0"
  }
}`,

    "README.md": `# Electron Desktop App

A cross-platform desktop todo application.

## Development

\`\`\`bash
npm install
npm run electron-dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run electron-pack
\`\`\`
`
  }
};

export const chromeExtensionTemplate = {
  id: "chrome-extension",
  name: "Chrome Extension",
  description: "Browser extension for Chrome with popup and content script",
  category: "Extension",
  difficulty: "Intermediate",
  tags: ["javascript", "chrome", "extension", "browser"],
  
  structure: {
    "manifest.json": `{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A useful Chrome extension",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "background": {
    "service_worker": "background.js"
  }
}`,

    "popup.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Extension</title>
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    button {
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      border: none;
      background: #4CAF50;
      color: white;
      cursor: pointer;
      border-radius: 4px;
    }
    button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <h2>Extension Popup</h2>
  <button id="actionBtn">Do Something</button>
  <div id="status"></div>
  <script src="popup.js"></script>
</body>
</html>`,

    "popup.js": `document.getElementById('actionBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'doSomething' }, (response) => {
    document.getElementById('status').textContent = response.status;
  });
});`,

    "content.js": `// Content script runs in the context of web pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'doSomething') {
    // Do something with the page
    console.log('Action received!');
    sendResponse({ status: 'Success!' });
  }
});

console.log('Extension loaded on:', window.location.href);`,

    "background.js": `// Service worker (background script)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
});`,

    "README.md": `# Chrome Extension

A browser extension template.

## Installation

1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this directory

## Development

Make changes and click the refresh icon in \`chrome://extensions/\`
`
  }
};
