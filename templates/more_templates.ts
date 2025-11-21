// Template 22: Nuxt.js SSR App
export const nuxtTemplate = {
  id: "nuxt-app",
  name: "Nuxt.js SSR App",
  description: "Server-side rendered application with Nuxt.js 3",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["vue", "nuxt", "ssr", "typescript"],
  
  structure: {
    "app.vue": `<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Nuxt App',
  meta: [
    { name: 'description', content: 'My Nuxt application' }
  ]
})
</script>`,

    "pages/index.vue": `<template>
  <div class="container">
    <h1>Welcome to Nuxt 3</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    
    <div class="todos">
      <h2>Todos</h2>
      <ul>
        <li v-for="todo in todos" :key="todo.id">
          {{ todo.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const count = ref(0)

const increment = () => {
  count.value++
}

// Fetch data server-side
const { data: todos } = await useFetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
button {
  padding: 10px 20px;
  background: #00dc82;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>`,

    "pages/about.vue": `<template>
  <div class="container">
    <h1>About Page</h1>
    <p>This is a server-side rendered page with Nuxt 3.</p>
    <NuxtLink to="/">Back to Home</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'About'
})
</script>`,

    "composables/useTodos.ts": `export const useTodos = () => {
  const todos = ref<Array<{id: number, title: string, completed: boolean}>>([])
  const loading = ref(false)
  
  const fetchTodos = async () => {
    loading.value = true
    try {
      const data = await $fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
      todos.value = data as any
    } finally {
      loading.value = false
    }
  }
  
  return {
    todos,
    loading,
    fetchTodos
  }
}`,

    "nuxt.config.ts": `export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    }
  }
})`,

    "package.json": `{
  "name": "nuxt-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview"
  },
  "devDependencies": {
    "nuxt": "^3.9.0",
    "vue": "^3.4.0",
    "vue-router": "^4.2.0"
  }
}`,

    "README.md": `# Nuxt.js SSR App

Modern SSR application with Nuxt 3.

## Features
- Server-side rendering
- File-based routing
- Auto imports
- Vue 3 Composition API
- TypeScript support

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:3000
`
  }
};

// Template 23: SolidJS App
export const solidjsTemplate = {
  id: "solidjs-app",
  name: "SolidJS Reactive App",
  description: "Performant reactive app with SolidJS",
  category: "Web App",
  difficulty: "Intermediate",
  tags: ["solidjs", "typescript", "reactive"],
  
  structure: {
    "src/App.tsx": `import { createSignal, For, Show } from 'solid-js';
import { Todo } from './types';
import './App.css';

function App() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [input, setInput] = createSignal('');

  const addTodo = () => {
    if (input().trim()) {
      setTodos([
        ...todos(),
        {
          id: Date.now(),
          text: input(),
          completed: false,
        },
      ]);
      setInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos().map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos().filter((todo) => todo.id !== id));
  };

  const activeTodos = () => todos().filter((t) => !t.completed).length;

  return (
    <div class="app">
      <h1>SolidJS Todo App</h1>

      <div class="add-todo">
        <input
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div class="todo-list">
        <For each={todos()}>
          {(todo) => (
            <div class="todo-item" classList={{ completed: todo.completed }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </div>
          )}
        </For>
      </div>

      <Show when={todos().length > 0}>
        <div class="stats">
          <p>{activeTodos()} items left</p>
        </div>
      </Show>
    </div>
  );
}

export default App;`,

    "src/types.ts": `export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}`,

    "src/index.tsx": `import { render } from 'solid-js/web';
import App from './App';
import './index.css';

const root = document.getElementById('root');

render(() => <App />, root!);`,

    "src/App.css": `.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.add-todo {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.add-todo input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-todo button {
  padding: 10px 20px;
  background: #2c4f7c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.todo-item.completed span {
  text-decoration: line-through;
  opacity: 0.6;
}

.stats {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}`,

    "package.json": `{
  "name": "solidjs-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "solid-js": "^1.8.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "vite-plugin-solid": "^2.8.0"
  }
}`,

    "vite.config.ts": `import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
});`,

    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}`,

    "README.md": `# SolidJS Reactive App

High-performance reactive application with SolidJS.

## Features
- Fine-grained reactivity
- No Virtual DOM
- Fast performance
- TypeScript
- Small bundle size

## Development
\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:5173
`
  }
};
