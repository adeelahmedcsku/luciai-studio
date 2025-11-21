/**
 * Feature 130: Code Snippet Library
 * Personal and team snippet management with multi-language support
 * 
 * Features:
 * - Personal snippet library
 * - Team snippet sharing
 * - Multi-language support (30+ languages)
 * - Advanced search and filtering
 * - Tags and categories
 * - Syntax highlighting
 * - Code preview
 * - Quick insert
 * - Import/Export
 * - Version history
 */

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  isTeamShared: boolean;
  author: {
    id: string;
    name: string;
    email: string;
  };
  created: Date;
  updated: Date;
  usageCount: number;
  favorited: boolean;
  rating: number;
  version: number;
  variables?: SnippetVariable[];
}

export interface SnippetVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
  description?: string;
}

export interface SnippetCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface SnippetCollection {
  id: string;
  name: string;
  description: string;
  snippets: string[]; // snippet IDs
  isPublic: boolean;
  created: Date;
  updated: Date;
}

export interface SnippetSearchFilters {
  query?: string;
  language?: string;
  category?: string;
  tags?: string[];
  author?: string;
  onlyFavorites?: boolean;
  onlyTeamShared?: boolean;
  sortBy?: 'recent' | 'popular' | 'title' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

export class CodeSnippetLibrary {
  private snippets: Map<string, CodeSnippet> = new Map();
  private categories: Map<string, SnippetCategory> = new Map();
  private collections: Map<string, SnippetCollection> = new Map();
  private readonly STORAGE_KEY = 'luciai_code_snippets';
  private readonly CATEGORIES_KEY = 'luciai_snippet_categories';
  private readonly COLLECTIONS_KEY = 'luciai_snippet_collections';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default snippet categories
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: SnippetCategory[] = [
      {
        id: 'algorithms',
        name: 'Algorithms',
        description: 'Common algorithms and data structures',
        icon: '🔢',
        count: 0
      },
      {
        id: 'api',
        name: 'API & HTTP',
        description: 'API calls, HTTP requests, REST patterns',
        icon: '🌐',
        count: 0
      },
      {
        id: 'database',
        name: 'Database',
        description: 'SQL queries, ORM patterns, database operations',
        icon: '🗄️',
        count: 0
      },
      {
        id: 'ui',
        name: 'UI Components',
        description: 'Reusable UI components and patterns',
        icon: '🎨',
        count: 0
      },
      {
        id: 'utils',
        name: 'Utilities',
        description: 'Helper functions and utilities',
        icon: '🔧',
        count: 0
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test cases, mocks, fixtures',
        icon: '🧪',
        count: 0
      },
      {
        id: 'security',
        name: 'Security',
        description: 'Authentication, encryption, validation',
        icon: '🔒',
        count: 0
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Optimization patterns and techniques',
        icon: '⚡',
        count: 0
      }
    ];

    defaultCategories.forEach(cat => {
      if (!this.categories.has(cat.id)) {
        this.categories.set(cat.id, cat);
      }
    });
  }

  /**
   * Create a new snippet
   */
  public createSnippet(snippet: Omit<CodeSnippet, 'id' | 'created' | 'updated' | 'usageCount' | 'version'>): CodeSnippet {
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: this.generateId(),
      created: new Date(),
      updated: new Date(),
      usageCount: 0,
      version: 1
    };

    this.snippets.set(newSnippet.id, newSnippet);
    this.updateCategoryCount(newSnippet.category, 1);
    this.saveToStorage();

    return newSnippet;
  }

  /**
   * Update an existing snippet
   */
  public updateSnippet(id: string, updates: Partial<CodeSnippet>): CodeSnippet | null {
    const snippet = this.snippets.get(id);
    if (!snippet) return null;

    const oldCategory = snippet.category;
    const updatedSnippet: CodeSnippet = {
      ...snippet,
      ...updates,
      id: snippet.id, // Preserve ID
      created: snippet.created, // Preserve creation date
      updated: new Date(),
      version: snippet.version + 1
    };

    this.snippets.set(id, updatedSnippet);

    // Update category counts if category changed
    if (updates.category && updates.category !== oldCategory) {
      this.updateCategoryCount(oldCategory, -1);
      this.updateCategoryCount(updates.category, 1);
    }

    this.saveToStorage();
    return updatedSnippet;
  }

  /**
   * Delete a snippet
   */
  public deleteSnippet(id: string): boolean {
    const snippet = this.snippets.get(id);
    if (!snippet) return false;

    this.snippets.delete(id);
    this.updateCategoryCount(snippet.category, -1);
    this.saveToStorage();

    return true;
  }

  /**
   * Get snippet by ID
   */
  public getSnippet(id: string): CodeSnippet | null {
    return this.snippets.get(id) || null;
  }

  /**
   * Search snippets
   */
  public searchSnippets(filters: SnippetSearchFilters = {}): CodeSnippet[] {
    let results = Array.from(this.snippets.values());

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.language) {
      results = results.filter(s => s.language === filters.language);
    }

    if (filters.category) {
      results = results.filter(s => s.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(s =>
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (filters.author) {
      results = results.filter(s => s.author.id === filters.author);
    }

    if (filters.onlyFavorites) {
      results = results.filter(s => s.favorited);
    }

    if (filters.onlyTeamShared) {
      results = results.filter(s => s.isTeamShared);
    }

    // Sort results
    const sortBy = filters.sortBy || 'recent';
    const sortOrder = filters.sortOrder || 'desc';

    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recent':
          comparison = b.updated.getTime() - a.updated.getTime();
          break;
        case 'popular':
          comparison = b.usageCount - a.usageCount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'usage':
          comparison = b.usageCount - a.usageCount;
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return results;
  }

  /**
   * Get all snippets
   */
  public getAllSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Toggle favorite status
   */
  public toggleFavorite(id: string): boolean {
    const snippet = this.snippets.get(id);
    if (!snippet) return false;

    snippet.favorited = !snippet.favorited;
    snippet.updated = new Date();
    this.saveToStorage();

    return snippet.favorited;
  }

  /**
   * Increment usage count
   */
  public incrementUsage(id: string): void {
    const snippet = this.snippets.get(id);
    if (!snippet) return;

    snippet.usageCount++;
    this.saveToStorage();
  }

  /**
   * Process snippet variables
   */
  public processVariables(code: string, values: Record<string, string>): string {
    let processed = code;
    
    Object.entries(values).forEach(([name, value]) => {
      const regex = new RegExp(`\\$\\{${name}\\}`, 'g');
      processed = processed.replace(regex, value);
    });

    return processed;
  }

  /**
   * Get snippet categories
   */
  public getCategories(): SnippetCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Create a collection
   */
  public createCollection(collection: Omit<SnippetCollection, 'id' | 'created' | 'updated'>): SnippetCollection {
    const newCollection: SnippetCollection = {
      ...collection,
      id: this.generateId(),
      created: new Date(),
      updated: new Date()
    };

    this.collections.set(newCollection.id, newCollection);
    this.saveToStorage();

    return newCollection;
  }

  /**
   * Add snippet to collection
   */
  public addToCollection(collectionId: string, snippetId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    if (!collection.snippets.includes(snippetId)) {
      collection.snippets.push(snippetId);
      collection.updated = new Date();
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Remove snippet from collection
   */
  public removeFromCollection(collectionId: string, snippetId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const index = collection.snippets.indexOf(snippetId);
    if (index > -1) {
      collection.snippets.splice(index, 1);
      collection.updated = new Date();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Get all collections
   */
  public getCollections(): SnippetCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Export snippets to JSON
   */
  public exportSnippets(snippetIds?: string[]): string {
    const snippetsToExport = snippetIds
      ? snippetIds.map(id => this.snippets.get(id)).filter(Boolean)
      : Array.from(this.snippets.values());

    return JSON.stringify({
      version: '2.0',
      exported: new Date().toISOString(),
      snippets: snippetsToExport
    }, null, 2);
  }

  /**
   * Import snippets from JSON
   */
  public importSnippets(json: string): { imported: number; skipped: number; errors: string[] } {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const data = JSON.parse(json);
      
      if (!data.snippets || !Array.isArray(data.snippets)) {
        result.errors.push('Invalid format: missing snippets array');
        return result;
      }

      data.snippets.forEach((snippet: any) => {
        try {
          // Check if snippet already exists
          const existing = Array.from(this.snippets.values()).find(
            s => s.title === snippet.title && s.code === snippet.code
          );

          if (existing) {
            result.skipped++;
            return;
          }

          // Create new snippet
          this.createSnippet({
            title: snippet.title,
            description: snippet.description || '',
            code: snippet.code,
            language: snippet.language,
            tags: snippet.tags || [],
            category: snippet.category || 'utils',
            isPublic: snippet.isPublic || false,
            isTeamShared: snippet.isTeamShared || false,
            author: snippet.author || { id: 'imported', name: 'Imported', email: '' },
            favorited: false,
            rating: snippet.rating || 0,
            variables: snippet.variables || []
          });

          result.imported++;
        } catch (error: any) {
          result.errors.push(`Failed to import "${snippet.title}": ${error.message}`);
        }
      });

    } catch (error: any) {
      result.errors.push(`Failed to parse JSON: ${error.message}`);
    }

    return result;
  }

  /**
   * Get popular snippets
   */
  public getPopularSnippets(limit: number = 10): CodeSnippet[] {
    return Array.from(this.snippets.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recent snippets
   */
  public getRecentSnippets(limit: number = 10): CodeSnippet[] {
    return Array.from(this.snippets.values())
      .sort((a, b) => b.updated.getTime() - a.updated.getTime())
      .slice(0, limit);
  }

  /**
   * Get favorite snippets
   */
  public getFavoriteSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values()).filter(s => s.favorited);
  }

  /**
   * Get team shared snippets
   */
  public getTeamSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values()).filter(s => s.isTeamShared);
  }

  /**
   * Get statistics
   */
  public getStatistics() {
    const snippets = Array.from(this.snippets.values());
    const languages = new Set(snippets.map(s => s.language));
    const tags = new Set(snippets.flatMap(s => s.tags));

    return {
      totalSnippets: snippets.length,
      favoriteSnippets: snippets.filter(s => s.favorited).length,
      teamSnippets: snippets.filter(s => s.isTeamShared).length,
      publicSnippets: snippets.filter(s => s.isPublic).length,
      totalLanguages: languages.size,
      totalTags: tags.size,
      totalUsage: snippets.reduce((sum, s) => sum + s.usageCount, 0),
      categories: this.getCategories(),
      collections: this.collections.size
    };
  }

  /**
   * Duplicate snippet
   */
  public duplicateSnippet(id: string, newTitle?: string): CodeSnippet | null {
    const original = this.snippets.get(id);
    if (!original) return null;

    return this.createSnippet({
      ...original,
      title: newTitle || `${original.title} (Copy)`,
      favorited: false,
      isPublic: false,
      isTeamShared: false
    });
  }

  // Private helper methods

  private generateId(): string {
    return `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateCategoryCount(categoryId: string, delta: number): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.count = Math.max(0, category.count + delta);
    }
  }

  private saveToStorage(): void {
    try {
      // Convert Maps to arrays for storage
      const snippetsArray = Array.from(this.snippets.values());
      const categoriesArray = Array.from(this.categories.values());
      const collectionsArray = Array.from(this.collections.values());

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snippetsArray));
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categoriesArray));
      localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collectionsArray));
    } catch (error) {
      console.error('Failed to save snippets to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      // Load snippets
      const snippetsData = localStorage.getItem(this.STORAGE_KEY);
      if (snippetsData) {
        const snippets: CodeSnippet[] = JSON.parse(snippetsData);
        snippets.forEach(snippet => {
          // Convert date strings back to Date objects
          snippet.created = new Date(snippet.created);
          snippet.updated = new Date(snippet.updated);
          this.snippets.set(snippet.id, snippet);
        });
      }

      // Load categories
      const categoriesData = localStorage.getItem(this.CATEGORIES_KEY);
      if (categoriesData) {
        const categories: SnippetCategory[] = JSON.parse(categoriesData);
        categories.forEach(category => {
          this.categories.set(category.id, category);
        });
      }

      // Load collections
      const collectionsData = localStorage.getItem(this.COLLECTIONS_KEY);
      if (collectionsData) {
        const collections: SnippetCollection[] = JSON.parse(collectionsData);
        collections.forEach(collection => {
          collection.created = new Date(collection.created);
          collection.updated = new Date(collection.updated);
          this.collections.set(collection.id, collection);
        });
      }
    } catch (error) {
      console.error('Failed to load snippets from storage:', error);
    }
  }
}

// Export singleton instance
export const codeSnippetLibrary = new CodeSnippetLibrary();
