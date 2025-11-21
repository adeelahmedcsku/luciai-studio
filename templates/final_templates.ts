// Template 24: Astro Blog
export const astroTemplate = {
  id: "astro-blog",
  name: "Astro Static Blog",
  description: "Fast static blog with Astro framework",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["astro", "blog", "static", "markdown"],
  
  structure: {
    "src/pages/index.astro": `---
import Layout from '../layouts/Layout.astro';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
const sortedPosts = posts.sort((a, b) => 
  new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
);
---

<Layout title="My Blog">
  <main>
    <h1>Welcome to My Blog</h1>
    
    <div class="posts">
      {sortedPosts.map(post => (
        <article class="post-card">
          <h2>
            <a href={\`/blog/\${post.slug}\`}>{post.data.title}</a>
          </h2>
          <p class="date">{post.data.date}</p>
          <p>{post.data.description}</p>
        </article>
      ))}
    </div>
  </main>
</Layout>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .posts {
    display: grid;
    gap: 20px;
    margin-top: 30px;
  }
  .post-card {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  .date {
    color: #666;
    font-size: 0.9em;
  }
</style>`,

    "src/pages/blog/[slug].astro": `---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<Layout title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <p class="date">{post.data.date}</p>
    <Content />
  </article>
</Layout>`,

    "src/layouts/Layout.astro": `---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>`,

    "src/content/config.ts": `import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string().optional(),
  }),
});

export const collections = { blog };`,

    "src/content/blog/first-post.md": `---
title: "My First Blog Post"
description: "This is my first post on my new Astro blog"
date: "2025-01-01"
author: "Your Name"
---

# Welcome to My Blog

This is my first post using **Astro**. It's amazing how fast it is!

## Why Astro?

- Fast static site generation
- Component islands architecture
- Markdown support
- Framework agnostic`,

    "package.json": `{
  "name": "astro-blog",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.0.0"
  }
}`,

    "astro.config.mjs": `import { defineConfig } from 'astro/config';

export default defineConfig({});`,

    "README.md": `# Astro Blog

Fast static blog built with Astro.

## Features
- Static site generation
- Markdown blog posts
- Fast page loads
- SEO friendly

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// Template 25: Remix App
export const remixTemplate = {
  id: "remix-app",
  name: "Remix Full-Stack App",
  description: "Full-stack web app with Remix",
  category: "Web App",
  difficulty: "Advanced",
  tags: ["remix", "react", "fullstack", "ssr"],
  
  structure: {
    "app/root.tsx": `import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}`,

    "app/routes/_index.tsx": `import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export async function loader() {
  // Fetch initial data
  const todos: Todo[] = [
    { id: 1, text: "Learn Remix", completed: false },
    { id: 2, text: "Build an app", completed: false },
  ];
  
  return json({ todos });
}

export default function Index() {
  const { todos: initialTodos } = useLoaderData<typeof loader>();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([
        ...todos,
        { id: Date.now(), text: input, completed: false },
      ]);
      setInput("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Remix Todo App</h1>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="What needs to be done?"
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div>
        {todos.map((todo) => (
          <div
            key={todo.id}
            style={{
              display: "flex",
              gap: "10px",
              padding: "10px",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                flex: 1,
              }}
            >
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}`,

    "app/routes/api.todos.tsx": `import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  
  // Handle API actions
  switch (action) {
    case "create":
      return json({ success: true });
    case "delete":
      return json({ success: true });
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
}`,

    "package.json": `{
  "name": "remix-app",
  "private": true,
  "sideEffects": false,
  "scripts": {
    "dev": "remix dev",
    "build": "remix build",
    "start": "remix-serve build"
  },
  "dependencies": {
    "@remix-run/node": "^2.4.0",
    "@remix-run/react": "^2.4.0",
    "@remix-run/serve": "^2.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@remix-run/dev": "^2.4.0",
    "typescript": "^5.2.0"
  }
}`,

    "remix.config.js": `/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
};`,

    "README.md": `# Remix Full-Stack App

Full-stack application with Remix.

## Features
- Server-side rendering
- Built-in routing
- Data loading
- Form handling
- TypeScript

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

// Template 26: NestJS Backend
export const nestjsTemplate = {
  id: "nestjs-backend",
  name: "NestJS REST API",
  description: "Enterprise backend with NestJS framework",
  category: "Backend",
  difficulty: "Advanced",
  tags: ["nestjs", "typescript", "rest", "api"],
  
  structure: {
    "src/main.ts": `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
  console.log(\`Application is running on: \${await app.getUrl()}\`);
}
bootstrap();`,

    "src/app.module.ts": `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [TodosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}`,

    "src/app.controller.ts": `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}`,

    "src/app.service.ts": `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NestJS API is running!';
  }
}`,

    "src/todos/todos.module.ts": `import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}`,

    "src/todos/todos.controller.ts": `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './dto';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.findOne(id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.remove(id);
  }
}`,

    "src/todos/todos.service.ts": `import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto, UpdateTodoDto } from './dto';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

@Injectable()
export class TodosService {
  private todos: Todo[] = [];
  private idCounter = 1;

  findAll(): Todo[] {
    return this.todos;
  }

  findOne(id: number): Todo {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) {
      throw new NotFoundException(\`Todo with ID \${id} not found\`);
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto): Todo {
    const todo: Todo = {
      id: this.idCounter++,
      ...createTodoDto,
      completed: false,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  update(id: number, updateTodoDto: UpdateTodoDto): Todo {
    const todo = this.findOne(id);
    Object.assign(todo, updateTodoDto);
    return todo;
  }

  remove(id: number): void {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException(\`Todo with ID \${id} not found\`);
    }
    this.todos.splice(index, 1);
  }
}`,

    "src/todos/dto/create-todo.dto.ts": `import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}`,

    "src/todos/dto/update-todo.dto.ts": `import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}`,

    "src/todos/dto/index.ts": `export * from './create-todo.dto';
export * from './update-todo.dto';`,

    "package.json": `{
  "name": "nestjs-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "typescript": "^5.2.0"
  }
}`,

    "tsconfig.json": `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true
  }
}`,

    "README.md": `# NestJS REST API

Enterprise-grade backend API with NestJS.

## Features
- Modular architecture
- Dependency injection
- Validation pipes
- TypeScript decorators
- RESTful endpoints

## Development
\`\`\`bash
npm install
npm run start:dev
\`\`\`

## API Endpoints
- GET /todos - Get all todos
- GET /todos/:id - Get one todo
- POST /todos - Create todo
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo
`
  }
};
