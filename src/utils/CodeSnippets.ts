/**
 * Common code snippets and patterns
 */

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  category: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  // React Components
  {
    id: "react-functional-component",
    name: "React Functional Component",
    description: "Basic functional component with TypeScript",
    language: "typescript",
    category: "react",
    code: `interface {{ComponentName}}Props {
  // Props here
}

export default function {{ComponentName}}({}: {{ComponentName}}Props) {
  return (
    <div className="{{className}}">
      <h1>{{ComponentName}}</h1>
    </div>
  );
}`,
  },
  {
    id: "react-component-with-state",
    name: "React Component with State",
    description: "Component with useState hook",
    language: "typescript",
    category: "react",
    code: `import { useState } from 'react';

interface {{ComponentName}}Props {
  // Props here
}

export default function {{ComponentName}}({}: {{ComponentName}}Props) {
  const [{{stateName}}, set{{StateNameCapital}}] = useState{{StateType}}({{initialValue}});

  return (
    <div className="{{className}}">
      <h1>{{ComponentName}}</h1>
      <p>{{stateName}}: {{{stateName}}}</p>
      <button onClick={() => set{{StateNameCapital}}({{newValue}})}>
        Update
      </button>
    </div>
  );
}`,
  },
  {
    id: "react-component-with-effect",
    name: "React Component with useEffect",
    description: "Component with side effects",
    language: "typescript",
    category: "react",
    code: `import { useState, useEffect } from 'react';

export default function {{ComponentName}}() {
  const [{{stateName}}, set{{StateNameCapital}}] = useState{{StateType}}({{initialValue}});

  useEffect(() => {
    // Effect logic here
    {{effectLogic}}

    // Cleanup (optional)
    return () => {
      {{cleanupLogic}}
    };
  }, [{{dependencies}}]);

  return (
    <div className="{{className}}">
      {/* Component JSX */}
    </div>
  );
}`,
  },
  {
    id: "react-custom-hook",
    name: "Custom React Hook",
    description: "Reusable custom hook",
    language: "typescript",
    category: "react",
    code: `import { useState, useEffect } from 'react';

export function use{{HookName}}({{parameters}}) {
  const [{{stateName}}, set{{StateNameCapital}}] = useState{{StateType}}({{initialValue}});

  useEffect(() => {
    // Hook logic
    {{hookLogic}}
  }, [{{dependencies}}]);

  return { {{stateName}}, set{{StateNameCapital}} };
}`,
  },

  // Express Routes
  {
    id: "express-basic-route",
    name: "Express Basic Route",
    description: "Simple Express route handler",
    language: "typescript",
    category: "express",
    code: `import { Router } from 'express';

const router = Router();

router.get('/{{routePath}}', (req, res) => {
  try {
    // Route logic
    {{routeLogic}}
    
    res.json({ success: true, data: {{responseData}} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;`,
  },
  {
    id: "express-crud-routes",
    name: "Express CRUD Routes",
    description: "Complete CRUD endpoints",
    language: "typescript",
    category: "express",
    code: `import { Router } from 'express';

const router = Router();

// Get all
router.get('/{{resource}}', async (req, res) => {
  try {
    const items = await {{Model}}.find();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get one
router.get('/{{resource}}/:id', async (req, res) => {
  try {
    const item = await {{Model}}.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create
router.post('/{{resource}}', async (req, res) => {
  try {
    const item = await {{Model}}.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update
router.put('/{{resource}}/:id', async (req, res) => {
  try {
    const item = await {{Model}}.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete
router.delete('/{{resource}}/:id', async (req, res) => {
  try {
    const item = await {{Model}}.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;`,
  },

  // Utilities
  {
    id: "fetch-wrapper",
    name: "Fetch Wrapper",
    description: "Reusable fetch utility with error handling",
    language: "typescript",
    category: "utilities",
    code: `export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchAPI<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(\`Network error: \${error.message}\`);
  }
}`,
  },
  {
    id: "localstorage-hook",
    name: "useLocalStorage Hook",
    description: "React hook for localStorage with sync",
    language: "typescript",
    category: "utilities",
    code: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}`,
  },

  // Database Models
  {
    id: "mongoose-model",
    name: "Mongoose Model",
    description: "MongoDB model with Mongoose",
    language: "typescript",
    category: "database",
    code: `import mongoose, { Schema, Document } from 'mongoose';

export interface I{{ModelName}} extends Document {
  {{field1}}: {{type1}};
  {{field2}}: {{type2}};
  createdAt: Date;
  updatedAt: Date;
}

const {{ModelName}}Schema: Schema = new Schema(
  {
    {{field1}}: {
      type: {{Type1}},
      required: true,
    },
    {{field2}}: {
      type: {{Type2}},
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<I{{ModelName}}>('{{ModelName}}', {{ModelName}}Schema);`,
  },

  // Testing
  {
    id: "react-component-test",
    name: "React Component Test",
    description: "Test for React component with Vitest",
    language: "typescript",
    category: "testing",
    code: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {{ComponentName}} from './{{ComponentName}}';

describe('{{ComponentName}}', () => {
  it('renders correctly', () => {
    render(<{{ComponentName}} />);
    expect(screen.getByText('{{expectedText}}')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<{{ComponentName}} />);
    
    // Test interaction
    {{testInteraction}}
    
    // Assert result
    {{assertion}}
  });
});`,
  },
];

/**
 * Get snippet by ID
 */
export function getSnippetById(id: string): CodeSnippet | undefined {
  return CODE_SNIPPETS.find((s) => s.id === id);
}

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: string): CodeSnippet[] {
  return CODE_SNIPPETS.filter((s) => s.category === category);
}

/**
 * Get snippets by language
 */
export function getSnippetsByLanguage(language: string): CodeSnippet[] {
  return CODE_SNIPPETS.filter((s) => s.language === language);
}

/**
 * Replace placeholders in snippet
 */
export function fillSnippet(
  snippet: CodeSnippet,
  replacements: Record<string, string>
): string {
  let code = snippet.code;

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    code = code.replace(new RegExp(placeholder, "g"), value);
  }

  return code;
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(CODE_SNIPPETS.map((s) => s.category)));
}
