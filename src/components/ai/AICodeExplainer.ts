/**
 * AI Code Explanation & Documentation System
 * Feature 124 - Intelligent code understanding and documentation generation
 * 
 * Capabilities:
 * - Explain code in natural language
 * - Generate JSDoc/docstrings automatically
 * - Create README sections
 * - Code-to-diagram conversion (flowcharts, sequence diagrams)
 * - Technical debt analyzer
 * - Complexity analysis
 * - Code smell detection
 * - Documentation quality checker
 * - Multi-language support
 * 
 * @module AICodeExplainer
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Explanation complexity levels
 */
export enum ExplanationLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
  ELI5 = 'eli5', // Explain Like I'm 5
}

/**
 * Documentation format types
 */
export enum DocumentationFormat {
  JSDOC = 'jsdoc',
  DOCSTRING = 'docstring',
  MARKDOWN = 'markdown',
  HTML = 'html',
  README = 'readme',
}

/**
 * Diagram types
 */
export enum DiagramType {
  FLOWCHART = 'flowchart',
  SEQUENCE = 'sequence',
  CLASS = 'class',
  COMPONENT = 'component',
  ARCHITECTURE = 'architecture',
}

/**
 * Code explanation result
 */
export interface CodeExplanation {
  id: string;
  code: string;
  language: string;
  explanation: string;
  level: ExplanationLevel;
  sections: {
    overview: string;
    purpose: string;
    howItWorks: string;
    keyComponents: string[];
    dependencies: string[];
    complexity: string;
    improvements: string[];
  };
  timestamp: Date;
}

/**
 * Generated documentation
 */
export interface GeneratedDocumentation {
  id: string;
  format: DocumentationFormat;
  content: string;
  metadata: {
    functions: number;
    classes: number;
    parameters: number;
    returnTypes: number;
    examples: number;
  };
  quality: {
    score: number;
    completeness: number;
    clarity: number;
    examples: number;
  };
  suggestions: string[];
}

/**
 * Code diagram
 */
export interface CodeDiagram {
  id: string;
  type: DiagramType;
  code: string;
  mermaidSyntax: string;
  svgOutput: string;
  description: string;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

/**
 * Technical debt item
 */
export interface TechnicalDebtItem {
  id: string;
  file: string;
  line: number;
  type: 'complexity' | 'duplication' | 'naming' | 'structure' | 'performance' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  code: string;
}

/**
 * Complexity analysis
 */
export interface ComplexityAnalysis {
  file: string;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  functions: Array<{
    name: string;
    complexity: number;
    lines: number;
    parameters: number;
    rating: 'simple' | 'moderate' | 'complex' | 'very-complex';
  }>;
  recommendations: string[];
}

/**
 * Code smell detection result
 */
export interface CodeSmell {
  id: string;
  type: string;
  description: string;
  location: {
    file: string;
    startLine: number;
    endLine: number;
  };
  severity: 'info' | 'warning' | 'error';
  suggestion: string;
  refactoringSteps: string[];
}

/**
 * README section
 */
export interface ReadmeSection {
  title: string;
  content: string;
  order: number;
  required: boolean;
}

/**
 * AI Code Explainer class
 */
export class AICodeExplainer {
  private explanationHistory: CodeExplanation[] = [];
  private documentationCache: Map<string, GeneratedDocumentation> = new Map();
  private diagramCache: Map<string, CodeDiagram> = new Map();

  /**
   * Explain code in natural language
   */
  async explainCode(
    code: string,
    language: string,
    level: ExplanationLevel = ExplanationLevel.INTERMEDIATE,
    context?: string
  ): Promise<CodeExplanation> {
    try {
      const prompt = this.buildExplanationPrompt(code, language, level, context);
      
      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: `You are an expert code explainer. Explain code clearly and accurately at the ${level} level.`,
      });

      const explanation = this.parseExplanation(response);

      const result: CodeExplanation = {
        id: `exp_${Date.now()}`,
        code,
        language,
        explanation: response,
        level,
        sections: explanation,
        timestamp: new Date(),
      };

      this.explanationHistory.unshift(result);
      if (this.explanationHistory.length > 50) {
        this.explanationHistory = this.explanationHistory.slice(0, 50);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to explain code: ${error}`);
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(
    code: string,
    language: string,
    format: DocumentationFormat = DocumentationFormat.JSDOC
  ): Promise<GeneratedDocumentation> {
    try {
      const cacheKey = `${language}_${format}_${this.hashCode(code)}`;
      
      if (this.documentationCache.has(cacheKey)) {
        return this.documentationCache.get(cacheKey)!;
      }

      const prompt = this.buildDocumentationPrompt(code, language, format);
      
      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: `You are an expert technical writer. Generate clear, comprehensive ${format} documentation.`,
      });

      const doc: GeneratedDocumentation = {
        id: `doc_${Date.now()}`,
        format,
        content: response,
        metadata: this.analyzeDocumentation(response),
        quality: this.assessDocumentationQuality(response),
        suggestions: this.generateDocSuggestions(response),
      };

      this.documentationCache.set(cacheKey, doc);
      return doc;
    } catch (error) {
      throw new Error(`Failed to generate documentation: ${error}`);
    }
  }

  /**
   * Generate code diagram
   */
  async generateDiagram(
    code: string,
    language: string,
    type: DiagramType = DiagramType.FLOWCHART
  ): Promise<CodeDiagram> {
    try {
      const cacheKey = `${language}_${type}_${this.hashCode(code)}`;
      
      if (this.diagramCache.has(cacheKey)) {
        return this.diagramCache.get(cacheKey)!;
      }

      const prompt = this.buildDiagramPrompt(code, language, type);
      
      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: `You are an expert at creating ${type} diagrams. Generate valid Mermaid syntax.`,
      });

      const mermaidSyntax = this.extractMermaidSyntax(response);
      const svg = await this.renderMermaidToSVG(mermaidSyntax);

      const diagram: CodeDiagram = {
        id: `dia_${Date.now()}`,
        type,
        code,
        mermaidSyntax,
        svgOutput: svg,
        description: this.extractDiagramDescription(response),
        nodes: this.extractNodes(mermaidSyntax),
        edges: this.extractEdges(mermaidSyntax),
      };

      this.diagramCache.set(cacheKey, diagram);
      return diagram;
    } catch (error) {
      throw new Error(`Failed to generate diagram: ${error}`);
    }
  }

  /**
   * Analyze technical debt
   */
  async analyzeTechnicalDebt(
    files: Array<{ path: string; content: string; language: string }>
  ): Promise<TechnicalDebtItem[]> {
    try {
      const debtItems: TechnicalDebtItem[] = [];

      for (const file of files) {
        const fileDebt = await this.analyzeFileForDebt(file);
        debtItems.push(...fileDebt);
      }

      // Sort by priority (severity + effort + impact)
      return debtItems.sort((a, b) => {
        const scoreA = this.calculateDebtPriority(a);
        const scoreB = this.calculateDebtPriority(b);
        return scoreB - scoreA;
      });
    } catch (error) {
      throw new Error(`Failed to analyze technical debt: ${error}`);
    }
  }

  /**
   * Analyze code complexity
   */
  async analyzeComplexity(code: string, language: string): Promise<ComplexityAnalysis> {
    try {
      const analysis = await invoke<ComplexityAnalysis>('analyze_code_complexity', {
        code,
        language,
      });

      // Enhance with AI recommendations
      const recommendations = await this.generateComplexityRecommendations(analysis);
      analysis.recommendations = recommendations;

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze complexity: ${error}`);
    }
  }

  /**
   * Detect code smells
   */
  async detectCodeSmells(
    code: string,
    language: string
  ): Promise<CodeSmell[]> {
    try {
      const prompt = `Analyze this ${language} code for code smells and anti-patterns:\n\n${code}\n\nIdentify specific code smells with their locations and provide refactoring suggestions.`;
      
      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert code reviewer specializing in identifying code smells and suggesting improvements.',
      });

      return this.parseCodeSmells(response, code);
    } catch (error) {
      throw new Error(`Failed to detect code smells: ${error}`);
    }
  }

  /**
   * Generate README sections
   */
  async generateReadme(
    projectInfo: {
      name: string;
      description?: string;
      language: string;
      files: Array<{ path: string; content: string }>;
    }
  ): Promise<ReadmeSection[]> {
    try {
      const sections: ReadmeSection[] = [];

      // Generate each section
      const sectionTypes = [
        'title',
        'description',
        'installation',
        'usage',
        'api',
        'examples',
        'contributing',
        'license',
      ];

      for (let i = 0; i < sectionTypes.length; i++) {
        const section = await this.generateReadmeSection(
          projectInfo,
          sectionTypes[i],
          i
        );
        sections.push(section);
      }

      return sections;
    } catch (error) {
      throw new Error(`Failed to generate README: ${error}`);
    }
  }

  /**
   * Explain specific code pattern
   */
  async explainPattern(
    code: string,
    language: string,
    patternName?: string
  ): Promise<{
    pattern: string;
    explanation: string;
    benefits: string[];
    drawbacks: string[];
    alternatives: string[];
    examples: string[];
  }> {
    try {
      const prompt = patternName
        ? `Explain how the ${patternName} pattern is implemented in this ${language} code:\n\n${code}`
        : `Identify and explain the design pattern used in this ${language} code:\n\n${code}`;

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert in software design patterns and best practices.',
      });

      return this.parsePatternExplanation(response);
    } catch (error) {
      throw new Error(`Failed to explain pattern: ${error}`);
    }
  }

  /**
   * Generate inline comments
   */
  async generateInlineComments(
    code: string,
    language: string,
    style: 'minimal' | 'detailed' = 'detailed'
  ): Promise<string> {
    try {
      const prompt = `Add ${style} inline comments to this ${language} code to explain what each section does:\n\n${code}\n\nReturn only the commented code.`;
      
      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert at writing clear, helpful code comments.',
      });

      return this.cleanCodeResponse(response);
    } catch (error) {
      throw new Error(`Failed to generate comments: ${error}`);
    }
  }

  /**
   * Assess documentation quality
   */
  assessDocumentationQuality(documentation: string): {
    score: number;
    completeness: number;
    clarity: number;
    examples: number;
  } {
    const metrics = {
      score: 0,
      completeness: 0,
      clarity: 0,
      examples: 0,
    };

    // Completeness: Check for key sections
    const hasDescription = /@description|@desc|Description:/i.test(documentation);
    const hasParams = /@param|@parameter|Parameters:/i.test(documentation);
    const hasReturns = /@returns?|@return|Returns:/i.test(documentation);
    const hasExamples = /@example|Example:/i.test(documentation);

    metrics.completeness = (
      (hasDescription ? 25 : 0) +
      (hasParams ? 25 : 0) +
      (hasReturns ? 25 : 0) +
      (hasExamples ? 25 : 0)
    );

    // Clarity: Check readability
    const avgSentenceLength = this.calculateAverageSentenceLength(documentation);
    metrics.clarity = Math.max(0, 100 - (avgSentenceLength - 15) * 2);

    // Examples: Count code examples
    const exampleMatches = documentation.match(/```[\s\S]*?```/g) || [];
    metrics.examples = Math.min(100, exampleMatches.length * 33);

    // Overall score
    metrics.score = (metrics.completeness + metrics.clarity + metrics.examples) / 3;

    return metrics;
  }

  /**
   * Get explanation history
   */
  getExplanationHistory(): CodeExplanation[] {
    return this.explanationHistory;
  }

  /**
   * Clear explanation history
   */
  clearHistory(): void {
    this.explanationHistory = [];
  }

  /**
   * Export explanation as markdown
   */
  exportExplanation(explanation: CodeExplanation): string {
    let markdown = `# Code Explanation\n\n`;
    markdown += `**Language:** ${explanation.language}\n`;
    markdown += `**Level:** ${explanation.level}\n`;
    markdown += `**Date:** ${explanation.timestamp.toLocaleDateString()}\n\n`;
    markdown += `## Overview\n\n${explanation.sections.overview}\n\n`;
    markdown += `## Purpose\n\n${explanation.sections.purpose}\n\n`;
    markdown += `## How It Works\n\n${explanation.sections.howItWorks}\n\n`;
    
    if (explanation.sections.keyComponents.length > 0) {
      markdown += `## Key Components\n\n`;
      for (const component of explanation.sections.keyComponents) {
        markdown += `- ${component}\n`;
      }
      markdown += '\n';
    }

    if (explanation.sections.improvements.length > 0) {
      markdown += `## Suggested Improvements\n\n`;
      for (const improvement of explanation.sections.improvements) {
        markdown += `- ${improvement}\n`;
      }
      markdown += '\n';
    }

    markdown += `## Original Code\n\n\`\`\`${explanation.language}\n${explanation.code}\n\`\`\`\n`;

    return markdown;
  }

  // Private helper methods

  private buildExplanationPrompt(
    code: string,
    language: string,
    level: ExplanationLevel,
    context?: string
  ): string {
    let prompt = `Explain this ${language} code at ${level} level:\n\n${code}\n\n`;
    
    if (context) {
      prompt += `Additional context: ${context}\n\n`;
    }

    prompt += `Provide:\n`;
    prompt += `1. A clear overview\n`;
    prompt += `2. The purpose of this code\n`;
    prompt += `3. How it works step by step\n`;
    prompt += `4. Key components\n`;
    prompt += `5. Dependencies\n`;
    prompt += `6. Complexity assessment\n`;
    prompt += `7. Potential improvements\n`;

    return prompt;
  }

  private buildDocumentationPrompt(
    code: string,
    language: string,
    format: DocumentationFormat
  ): string {
    return `Generate ${format} documentation for this ${language} code:\n\n${code}\n\nInclude:\n- Clear descriptions\n- Parameter documentation\n- Return value documentation\n- Usage examples\n- Edge cases`;
  }

  private buildDiagramPrompt(
    code: string,
    language: string,
    type: DiagramType
  ): string {
    return `Create a ${type} diagram in Mermaid syntax for this ${language} code:\n\n${code}\n\nOutput valid Mermaid syntax that visualizes the code structure and flow.`;
  }

  private parseExplanation(response: string): CodeExplanation['sections'] {
    // Parse AI response into structured sections
    return {
      overview: this.extractSection(response, 'overview') || 'Overview not available',
      purpose: this.extractSection(response, 'purpose') || 'Purpose not specified',
      howItWorks: this.extractSection(response, 'how it works') || 'Explanation not available',
      keyComponents: this.extractList(response, 'key components'),
      dependencies: this.extractList(response, 'dependencies'),
      complexity: this.extractSection(response, 'complexity') || 'Not assessed',
      improvements: this.extractList(response, 'improvements'),
    };
  }

  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([^\\n]+(?:\\n(?!\\d+\\.|[A-Z]).*)*)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractList(text: string, sectionName: string): string[] {
    const section = this.extractSection(text, sectionName);
    if (!section) return [];
    
    const items = section.match(/[-*]\s+(.+)/g) || [];
    return items.map(item => item.replace(/^[-*]\s+/, '').trim());
  }

  private analyzeDocumentation(doc: string): GeneratedDocumentation['metadata'] {
    return {
      functions: (doc.match(/@function|function\s+\w+/gi) || []).length,
      classes: (doc.match(/@class|class\s+\w+/gi) || []).length,
      parameters: (doc.match(/@param/gi) || []).length,
      returnTypes: (doc.match(/@returns?/gi) || []).length,
      examples: (doc.match(/@example/gi) || []).length,
    };
  }

  private generateDocSuggestions(doc: string): string[] {
    const suggestions: string[] = [];

    if (!/@param/i.test(doc)) {
      suggestions.push('Consider adding parameter documentation');
    }
    if (!/@returns?/i.test(doc)) {
      suggestions.push('Consider documenting the return value');
    }
    if (!/@example/i.test(doc)) {
      suggestions.push('Consider adding usage examples');
    }

    return suggestions;
  }

  private extractMermaidSyntax(response: string): string {
    const match = response.match(/```mermaid\n([\s\S]*?)```/);
    return match ? match[1].trim() : response;
  }

  private async renderMermaidToSVG(mermaid: string): Promise<string> {
    try {
      return await invoke<string>('render_mermaid_diagram', { mermaid });
    } catch (error) {
      return '<svg>Diagram rendering failed</svg>';
    }
  }

  private extractDiagramDescription(response: string): string {
    const lines = response.split('\n');
    const descriptionLines = lines.filter(line => 
      !line.includes('```') && line.trim() && !line.trim().startsWith('graph')
    );
    return descriptionLines.join(' ').trim();
  }

  private extractNodes(mermaid: string): CodeDiagram['nodes'] {
    const nodes: CodeDiagram['nodes'] = [];
    const nodeRegex = /(\w+)\[([^\]]+)\]/g;
    let match;
    
    while ((match = nodeRegex.exec(mermaid)) !== null) {
      nodes.push({
        id: match[1],
        label: match[2],
        type: 'node',
      });
    }
    
    return nodes;
  }

  private extractEdges(mermaid: string): CodeDiagram['edges'] {
    const edges: CodeDiagram['edges'] = [];
    const edgeRegex = /(\w+)\s*--?>?\s*(\w+)/g;
    let match;
    
    while ((match = edgeRegex.exec(mermaid)) !== null) {
      edges.push({
        from: match[1],
        to: match[2],
      });
    }
    
    return edges;
  }

  private async analyzeFileForDebt(file: {
    path: string;
    content: string;
    language: string;
  }): Promise<TechnicalDebtItem[]> {
    const prompt = `Analyze this ${file.language} code for technical debt:\n\n${file.content}\n\nIdentify complexity issues, duplication, naming problems, structural issues, and potential improvements.`;
    
    const response = await invoke<string>('generate_llm_response', {
      prompt,
      systemPrompt: 'You are an expert code quality analyzer.',
    });

    return this.parseDebtItems(response, file.path);
  }

  private parseDebtItems(response: string, file: string): TechnicalDebtItem[] {
    // Parse AI response into debt items
    // This is a simplified implementation
    const items: TechnicalDebtItem[] = [];
    
    const sections = response.split(/\d+\./);
    for (const section of sections.slice(1)) {
      if (section.trim()) {
        items.push({
          id: `debt_${Date.now()}_${Math.random()}`,
          file,
          line: 0,
          type: 'complexity',
          severity: 'medium',
          description: section.trim().substring(0, 100),
          suggestion: 'Review and refactor',
          effort: 'medium',
          impact: 'medium',
          code: '',
        });
      }
    }
    
    return items;
  }

  private calculateDebtPriority(item: TechnicalDebtItem): number {
    const severityScore = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    
    const impactScore = {
      high: 3,
      medium: 2,
      low: 1,
    };
    
    const effortScore = {
      low: 3,
      medium: 2,
      high: 1,
    };
    
    return (
      severityScore[item.severity] * 3 +
      impactScore[item.impact] * 2 +
      effortScore[item.effort]
    );
  }

  private async generateComplexityRecommendations(
    analysis: ComplexityAnalysis
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (analysis.cyclomaticComplexity > 10) {
      recommendations.push('Consider breaking down complex functions into smaller ones');
    }
    
    if (analysis.linesOfCode > 500) {
      recommendations.push('File is large - consider splitting into multiple modules');
    }
    
    return recommendations;
  }

  private parseCodeSmells(_response: string, _code: string): CodeSmell[] {
    // Simplified parsing - would be more sophisticated in production
    return [];
  }

  private async generateReadmeSection(
    projectInfo: any,
    sectionType: string,
    order: number
  ): Promise<ReadmeSection> {
    const prompt = `Generate a ${sectionType} section for a README for a ${projectInfo.language} project named "${projectInfo.name}".`;
    
    const content = await invoke<string>('generate_llm_response', {
      prompt,
      systemPrompt: 'You are an expert technical writer creating professional README files.',
    });

    return {
      title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      content: content.trim(),
      order,
      required: ['title', 'description', 'installation', 'usage'].includes(sectionType),
    };
  }

  private parsePatternExplanation(response: string): any {
    return {
      pattern: this.extractSection(response, 'pattern') || 'Unknown',
      explanation: this.extractSection(response, 'explanation') || '',
      benefits: this.extractList(response, 'benefits'),
      drawbacks: this.extractList(response, 'drawbacks'),
      alternatives: this.extractList(response, 'alternatives'),
      examples: this.extractList(response, 'examples'),
    };
  }

  private cleanCodeResponse(response: string): string {
    // Remove markdown code blocks if present
    const match = response.match(/```[\w]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : response.trim();
  }

  private calculateAverageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0);
    
    return totalWords / sentences.length;
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Global AI code explainer instance
 */
export const aiCodeExplainer = new AICodeExplainer();

export default AICodeExplainer;
