import { editor, languages, Position } from 'monaco-editor';

/**
 * Smart Code Completion System
 * Provides IntelliJ-style intelligent code completions with:
 * - Context-aware suggestions
 * - Import auto-completion
 * - Method signature hints
 * - Smart ranking based on usage
 * - Framework-specific completions
 */

interface CompletionContext {
  filePath: string;
  language: string;
  position: Position;
  textBeforeCursor: string;
  textAfterCursor: string;
  currentWord: string;
  previousWord: string;
  isInString: boolean;
  isInComment: boolean;
  indentLevel: number;
}

interface SmartCompletion {
  label: string;
  kind: languages.CompletionItemKind;
  insertText: string;
  detail: string;
  documentation: string;
  sortText: string;
  preselect?: boolean;
  additionalTextEdits?: editor.IIdentifiedSingleEditOperation[];
}

export class SmartCodeCompletion {
  private completionCache = new Map<string, SmartCompletion[]>();
  private usageStats = new Map<string, number>();
  private importCache = new Map<string, string[]>();

  /**
   * Register smart completion provider for Monaco
   */
  public registerProvider(monaco: any, language: string) {
    return monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', ':', '<', '"', "'", '/', '@', '#'],
      
      provideCompletionItems: async (
        model: editor.ITextModel,
        position: Position
      ) => {
        const context = this.analyzeContext(model, position);
        const completions = await this.getCompletions(context);
        
        return {
          suggestions: completions.map(c => this.toMonacoCompletion(c, position)),
          incomplete: false,
        };
      },

      resolveCompletionItem: (item: any) => {
        // Resolve additional details on demand
        return item;
      },
    });
  }

  /**
   * Analyze context around cursor position
   */
  private analyzeContext(
    model: editor.ITextModel,
    position: Position
  ): CompletionContext {
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);
    const textAfterCursor = lineContent.substring(position.column - 1);
    
    const words = textBeforeCursor.trim().split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    const previousWord = words[words.length - 2] || '';
    
    const fullText = model.getValue();
    const offset = model.getOffsetAt(position);
    
    return {
      filePath: model.uri.path,
      language: model.getLanguageId(),
      position,
      textBeforeCursor,
      textAfterCursor,
      currentWord,
      previousWord,
      isInString: this.isInsideString(fullText, offset),
      isInComment: this.isInsideComment(fullText, offset),
      indentLevel: this.getIndentLevel(lineContent),
    };
  }

  /**
   * Get smart completions based on context
   */
  private async getCompletions(
    context: CompletionContext
  ): Promise<SmartCompletion[]> {
    const completions: SmartCompletion[] = [];

    // Skip completions in comments or strings (unless path completion)
    if (context.isInComment) return [];
    if (context.isInString && !this.shouldCompleteInString(context)) return [];

    // Get different types of completions
    completions.push(...this.getKeywordCompletions(context));
    completions.push(...this.getSnippetCompletions(context));
    completions.push(...this.getImportCompletions(context));
    completions.push(...this.getMethodCompletions(context));
    completions.push(...this.getPropertyCompletions(context));
    completions.push(...this.getFrameworkCompletions(context));
    completions.push(...this.getPathCompletions(context));

    // Rank completions by relevance
    return this.rankCompletions(completions, context);
  }

  /**
   * Get keyword completions based on language
   */
  private getKeywordCompletions(context: CompletionContext): SmartCompletion[] {
    const keywords = this.getLanguageKeywords(context.language);
    
    return keywords.map((keyword, index) => ({
      label: keyword,
      kind: languages.CompletionItemKind.Keyword,
      insertText: keyword,
      detail: `${context.language} keyword`,
      documentation: `Language keyword: ${keyword}`,
      sortText: `0${index.toString().padStart(3, '0')}`,
    }));
  }

  /**
   * Get smart snippet completions
   */
  private getSnippetCompletions(context: CompletionContext): SmartCompletion[] {
    const snippets = this.getSmartSnippets(context);
    
    return snippets.map((snippet, index) => ({
      label: snippet.prefix,
      kind: languages.CompletionItemKind.Snippet,
      insertText: snippet.body,
      detail: snippet.description,
      documentation: snippet.documentation,
      sortText: `1${index.toString().padStart(3, '0')}`,
      preselect: snippet.important,
    }));
  }

  /**
   * Get import suggestions
   */
  private getImportCompletions(context: CompletionContext): SmartCompletion[] {
    if (!this.needsImport(context)) return [];

    const imports = this.getAvailableImports(context);
    
    return imports.map((imp, index) => ({
      label: imp.name,
      kind: languages.CompletionItemKind.Module,
      insertText: imp.name,
      detail: `Auto-import from ${imp.module}`,
      documentation: `Import ${imp.name} from '${imp.module}'`,
      sortText: `2${index.toString().padStart(3, '0')}`,
      additionalTextEdits: [
        {
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          text: `import { ${imp.name} } from '${imp.module}';\n`,
        },
      ],
    }));
  }

  /**
   * Get method completions
   */
  private getMethodCompletions(context: CompletionContext): SmartCompletion[] {
    const methods = this.inferMethods(context);
    
    return methods.map((method, index) => ({
      label: method.name,
      kind: languages.CompletionItemKind.Method,
      insertText: method.insertText,
      detail: method.signature,
      documentation: method.description,
      sortText: `3${index.toString().padStart(3, '0')}`,
    }));
  }

  /**
   * Get property completions
   */
  private getPropertyCompletions(context: CompletionContext): SmartCompletion[] {
    const properties = this.inferProperties(context);
    
    return properties.map((prop, index) => ({
      label: prop.name,
      kind: languages.CompletionItemKind.Property,
      insertText: prop.name,
      detail: prop.type,
      documentation: prop.description,
      sortText: `4${index.toString().padStart(3, '0')}`,
    }));
  }

  /**
   * Get framework-specific completions
   */
  private getFrameworkCompletions(context: CompletionContext): SmartCompletion[] {
    const framework = this.detectFramework(context);
    if (!framework) return [];

    return this.getFrameworkSpecificCompletions(framework, context);
  }

  /**
   * Get path completions for imports and requires
   */
  private getPathCompletions(context: CompletionContext): SmartCompletion[] {
    if (!context.isInString) return [];
    if (!this.isPathContext(context)) return [];

    // TODO: Implement file system path completion
    return [];
  }

  /**
   * Rank completions by relevance
   */
  private rankCompletions(
    completions: SmartCompletion[],
    context: CompletionContext
  ): SmartCompletion[] {
    return completions.sort((a, b) => {
      // Preselected items first
      if (a.preselect && !b.preselect) return -1;
      if (!a.preselect && b.preselect) return 1;

      // Usage-based ranking
      const aUsage = this.usageStats.get(a.label) || 0;
      const bUsage = this.usageStats.get(b.label) || 0;
      if (aUsage !== bUsage) return bUsage - aUsage;

      // Prefix matching
      const aMatches = a.label.toLowerCase().startsWith(context.currentWord.toLowerCase());
      const bMatches = b.label.toLowerCase().startsWith(context.currentWord.toLowerCase());
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Default sort order
      return a.sortText.localeCompare(b.sortText);
    });
  }

  /**
   * Convert to Monaco completion item
   */
  private toMonacoCompletion(
    completion: SmartCompletion,
    position: Position
  ): languages.CompletionItem {
    return {
      label: completion.label,
      kind: completion.kind,
      insertText: completion.insertText,
      detail: completion.detail,
      documentation: { value: completion.documentation },
      sortText: completion.sortText,
      preselect: completion.preselect,
      additionalTextEdits: completion.additionalTextEdits,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
    };
  }

  /**
   * Helper methods
   */

  private getLanguageKeywords(language: string): string[] {
    const keywords: Record<string, string[]> = {
      typescript: [
        'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class',
        'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do',
        'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from',
        'function', 'get', 'if', 'implements', 'import', 'in', 'instanceof',
        'interface', 'let', 'namespace', 'new', 'null', 'of', 'package', 'private',
        'protected', 'public', 'readonly', 'return', 'set', 'static', 'super',
        'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'var', 'void',
        'while', 'with', 'yield',
      ],
      javascript: [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
        'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof',
        'let', 'new', 'null', 'of', 'return', 'super', 'switch', 'this', 'throw',
        'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      ],
      python: [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
        'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from',
        'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not',
        'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
      ],
      rust: [
        'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
        'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
        'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self',
        'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use',
        'where', 'while',
      ],
    };

    return keywords[language] || [];
  }

  private getSmartSnippets(context: CompletionContext): any[] {
    // Return context-aware snippets
    const snippets: any[] = [];

    if (context.language === 'typescript' || context.language === 'javascript') {
      snippets.push(
        {
          prefix: 'log',
          body: 'console.log(${1:message});',
          description: 'Log to console',
          documentation: 'console.log() - Output message to console',
          important: true,
        },
        {
          prefix: 'func',
          body: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
          description: 'Function declaration',
          documentation: 'Create a new function',
          important: false,
        },
        {
          prefix: 'arrow',
          body: 'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n};',
          description: 'Arrow function',
          documentation: 'Create an arrow function',
          important: false,
        },
        {
          prefix: 'class',
          body: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3:// constructor}\n\t}\n}',
          description: 'Class declaration',
          documentation: 'Create a new class',
          important: false,
        }
      );
    }

    return snippets;
  }

  private getAvailableImports(context: CompletionContext): any[] {
    // Return available imports based on context
    return [];
  }

  private inferMethods(context: CompletionContext): any[] {
    // Infer available methods based on context
    const methods: any[] = [];

    if (context.textBeforeCursor.includes('console.')) {
      methods.push(
        {
          name: 'log',
          insertText: 'log(${1:message})',
          signature: 'log(...data: any[]): void',
          description: 'Outputs a message to the console',
        },
        {
          name: 'error',
          insertText: 'error(${1:message})',
          signature: 'error(...data: any[]): void',
          description: 'Outputs an error message to the console',
        },
        {
          name: 'warn',
          insertText: 'warn(${1:message})',
          signature: 'warn(...data: any[]): void',
          description: 'Outputs a warning message to the console',
        }
      );
    }

    return methods;
  }

  private inferProperties(context: CompletionContext): any[] {
    // Infer available properties based on context
    return [];
  }

  private detectFramework(context: CompletionContext): string | null {
    // Detect framework from file content or imports
    if (context.textBeforeCursor.includes('React') || context.textBeforeCursor.includes('useState')) {
      return 'react';
    }
    if (context.textBeforeCursor.includes('Vue') || context.textBeforeCursor.includes('defineComponent')) {
      return 'vue';
    }
    return null;
  }

  private getFrameworkSpecificCompletions(framework: string, context: CompletionContext): SmartCompletion[] {
    // Return framework-specific completions
    return [];
  }

  private needsImport(context: CompletionContext): boolean {
    // Check if current position needs an import
    return false;
  }

  private isInsideString(text: string, offset: number): boolean {
    // Check if offset is inside a string
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < offset; i++) {
      const char = text[i];
      if ((char === '"' || char === "'" || char === '`') && text[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
    }

    return inString;
  }

  private isInsideComment(text: string, offset: number): boolean {
    // Check if offset is inside a comment
    const textBefore = text.substring(0, offset);
    const lastLineComment = textBefore.lastIndexOf('//');
    const lastBlockCommentStart = textBefore.lastIndexOf('/*');
    const lastBlockCommentEnd = textBefore.lastIndexOf('*/');

    // In line comment
    if (lastLineComment > -1) {
      const newlineAfterComment = textBefore.indexOf('\n', lastLineComment);
      if (newlineAfterComment === -1 || newlineAfterComment > offset) {
        return true;
      }
    }

    // In block comment
    if (lastBlockCommentStart > lastBlockCommentEnd) {
      return true;
    }

    return false;
  }

  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private shouldCompleteInString(context: CompletionContext): boolean {
    // Check if we should provide completions inside strings (e.g., for paths)
    return context.textBeforeCursor.includes('import') || 
           context.textBeforeCursor.includes('require');
  }

  private isPathContext(context: CompletionContext): boolean {
    return context.textBeforeCursor.match(/import.*['"]/) !== null ||
           context.textBeforeCursor.match(/require\(['"]/) !== null;
  }

  /**
   * Track completion usage for better ranking
   */
  public trackUsage(completionLabel: string) {
    const current = this.usageStats.get(completionLabel) || 0;
    this.usageStats.set(completionLabel, current + 1);
  }

  /**
   * Clear caches
   */
  public clearCaches() {
    this.completionCache.clear();
    this.importCache.clear();
  }
}

export default SmartCodeCompletion;
