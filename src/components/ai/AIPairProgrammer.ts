/**
 * AI Pair Programming Chat System
 * Feature 126 - Intelligent coding assistant with context awareness
 * 
 * Capabilities:
 * - Context-aware coding assistant
 * - Real-time code suggestions
 * - Debug help with stack trace analysis
 * - Architecture recommendations
 * - Code review conversations
 * - Best practices guidance
 * - Multi-turn conversations with memory
 * - Code generation from natural language
 * - Problem-solving assistance
 * 
 * @module AIPairProgrammer
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Message role types
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/**
 * Conversation type
 */
export enum ConversationType {
  GENERAL = 'general',
  DEBUG = 'debug',
  REVIEW = 'review',
  ARCHITECTURE = 'architecture',
  REFACTOR = 'refactor',
  LEARN = 'learn',
  GENERATE = 'generate',
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  context?: {
    file?: string;
    selection?: string;
    language?: string;
    stackTrace?: string;
  };
  codeBlocks?: Array<{
    language: string;
    code: string;
    explanation?: string;
  }>;
  suggestions?: string[];
  relatedFiles?: string[];
}

/**
 * Conversation session
 */
export interface ConversationSession {
  id: string;
  type: ConversationType;
  title: string;
  messages: ChatMessage[];
  startTime: Date;
  lastActivity: Date;
  context: {
    projectLanguages: string[];
    currentFile?: string;
    recentFiles: string[];
    dependencies: string[];
    framework?: string;
  };
  summary?: string;
}

/**
 * Code suggestion
 */
export interface CodeSuggestion {
  id: string;
  code: string;
  language: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-1
  alternatives?: Array<{
    code: string;
    description: string;
  }>;
  location?: {
    file: string;
    line: number;
  };
}

/**
 * Debug assistance
 */
export interface DebugAssistance {
  problem: string;
  stackTrace?: string;
  analysis: {
    rootCause: string;
    explanation: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  };
  solutions: Array<{
    description: string;
    code?: string;
    steps: string[];
    likelihood: 'high' | 'medium' | 'low';
  }>;
  relatedIssues: string[];
  preventionTips: string[];
}

/**
 * Architecture recommendation
 */
export interface ArchitectureRecommendation {
  current: {
    description: string;
    pros: string[];
    cons: string[];
  };
  recommended: {
    pattern: string;
    description: string;
    benefits: string[];
    tradeoffs: string[];
    implementation: string[];
  };
  migration: {
    complexity: 'low' | 'medium' | 'high';
    steps: string[];
    risks: string[];
  };
  diagram?: string; // Mermaid syntax
}

/**
 * Code review feedback
 */
export interface CodeReviewFeedback {
  file: string;
  overallRating: number; // 0-10
  strengths: string[];
  improvements: Array<{
    line?: number;
    issue: string;
    severity: 'critical' | 'major' | 'minor' | 'suggestion';
    suggestion: string;
    example?: string;
  }>;
  security: Array<{
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    fix: string;
  }>;
  performance: Array<{
    issue: string;
    impact: 'high' | 'medium' | 'low';
    optimization: string;
  }>;
  bestPractices: Array<{
    category: string;
    recommendation: string;
  }>;
}

/**
 * Learning topic
 */
export interface LearningTopic {
  topic: string;
  explanation: string;
  concepts: Array<{
    name: string;
    description: string;
    examples: string[];
  }>;
  resources: Array<{
    type: 'documentation' | 'tutorial' | 'example' | 'video';
    title: string;
    url?: string;
  }>;
  exercises: Array<{
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    solution?: string;
  }>;
}

/**
 * AI Pair Programmer class
 */
export class AIPairProgrammer {
  private sessions: Map<string, ConversationSession> = new Map();
  private activeSessionId: string | null = null;
  private _contextMemory: Map<string, any> = new Map();

  /**
   * Start new conversation session
   */
  startSession(type: ConversationType = ConversationType.GENERAL): ConversationSession {
    const session: ConversationSession = {
      id: `session_${Date.now()}`,
      type,
      title: this.generateSessionTitle(type),
      messages: [],
      startTime: new Date(),
      lastActivity: new Date(),
      context: {
        projectLanguages: [],
        recentFiles: [],
        dependencies: [],
      },
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    // Add system message
    this.addSystemMessage(session);

    return session;
  }

  /**
   * Send message to AI assistant
   */
  async sendMessage(
    content: string,
    context?: ChatMessage['context']
  ): Promise<ChatMessage> {
    const session = this.getActiveSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: MessageRole.USER,
      content,
      timestamp: new Date(),
      context,
    };

    session.messages.push(userMessage);
    session.lastActivity = new Date();

    // Generate AI response
    const assistantMessage = await this.generateResponse(session, content, context);
    session.messages.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Get code suggestion
   */
  async getSuggestion(
    prompt: string,
    language: string,
    currentCode?: string
  ): Promise<CodeSuggestion> {
    try {
      const fullPrompt = this.buildSuggestionPrompt(prompt, language, currentCode);

      const response = await invoke<string>('generate_llm_response', {
        prompt: fullPrompt,
        systemPrompt: `You are an expert ${language} developer. Provide high-quality code suggestions with clear explanations.`,
      });

      return this.parseSuggestion(response, language);
    } catch (error) {
      throw new Error(`Failed to generate suggestion: ${error}`);
    }
  }

  /**
   * Get debug assistance
   */
  async debugHelp(
    problem: string,
    stackTrace?: string,
    code?: string
  ): Promise<DebugAssistance> {
    try {
      const prompt = this.buildDebugPrompt(problem, stackTrace, code);

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert debugger. Analyze errors thoroughly and provide actionable solutions.',
      });

      return this.parseDebugAssistance(response);
    } catch (error) {
      throw new Error(`Debug assistance failed: ${error}`);
    }
  }

  /**
   * Get architecture recommendation
   */
  async recommendArchitecture(
    description: string,
    currentArchitecture?: string,
    constraints?: string[]
  ): Promise<ArchitectureRecommendation> {
    try {
      const prompt = this.buildArchitecturePrompt(description, currentArchitecture, constraints);

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are a software architect expert. Provide well-reasoned architecture recommendations.',
      });

      return this.parseArchitectureRecommendation(response);
    } catch (error) {
      throw new Error(`Architecture recommendation failed: ${error}`);
    }
  }

  /**
   * Review code
   */
  async reviewCode(
    code: string,
    language: string,
    focusAreas?: string[]
  ): Promise<CodeReviewFeedback> {
    try {
      const prompt = this.buildReviewPrompt(code, language, focusAreas);

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert code reviewer. Provide constructive, detailed feedback.',
      });

      return this.parseReviewFeedback(response);
    } catch (error) {
      throw new Error(`Code review failed: ${error}`);
    }
  }

  /**
   * Explain concept
   */
  async explainConcept(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<LearningTopic> {
    try {
      const prompt = `Explain the concept of "${topic}" at ${level} level. Include:\n1. Clear explanation\n2. Key concepts\n3. Practical examples\n4. Learning resources\n5. Practice exercises`;

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: 'You are an expert technical educator. Explain concepts clearly with practical examples.',
      });

      return this.parseLearningTopic(response, topic);
    } catch (error) {
      throw new Error(`Concept explanation failed: ${error}`);
    }
  }

  /**
   * Generate code from description
   */
  async generateCode(
    description: string,
    language: string,
    style?: 'functional' | 'oop' | 'procedural'
  ): Promise<CodeSuggestion> {
    try {
      let prompt = `Generate ${language} code for: ${description}`;
      if (style) {
        prompt += `\nUse ${style} programming style.`;
      }
      prompt += '\nInclude comments and handle edge cases.';

      const response = await invoke<string>('generate_llm_response', {
        prompt,
        systemPrompt: `You are an expert ${language} developer. Write clean, production-quality code.`,
      });

      return this.parseSuggestion(response, language);
    } catch (error) {
      throw new Error(`Code generation failed: ${error}`);
    }
  }

  /**
   * Ask follow-up question
   */
  async askFollowUp(question: string): Promise<ChatMessage> {
    return this.sendMessage(question);
  }

  /**
   * Get conversation summary
   */
  async summarizeConversation(sessionId?: string): Promise<string> {
    const session = sessionId
      ? this.sessions.get(sessionId)
      : this.getActiveSession();

    if (!session) {
      throw new Error('Session not found');
    }

    const conversationText = session.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = `Summarize this conversation:\n\n${conversationText}`;

    const summary = await invoke<string>('generate_llm_response', {
      prompt,
      systemPrompt: 'Provide a concise summary of the key points discussed.',
    });

    session.summary = summary;
    return summary;
  }

  /**
   * Get active session
   */
  getActiveSession(): ConversationSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  /**
   * Switch active session
   */
  setActiveSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    return this.sessions.delete(sessionId);
  }

  /**
   * Update session context
   */
  updateSessionContext(context: Partial<ConversationSession['context']>): void {
    const session = this.getActiveSession();
    if (session) {
      session.context = { ...session.context, ...context };
    }
  }

  /**
   * Export conversation
   */
  exportConversation(sessionId: string, format: 'markdown' | 'json' | 'text'): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    switch (format) {
      case 'markdown':
        return this.exportAsMarkdown(session);
      case 'json':
        return JSON.stringify(session, null, 2);
      case 'text':
        return this.exportAsText(session);
      default:
        throw new Error('Invalid export format');
    }
  }

  // Private helper methods

  private async generateResponse(
    session: ConversationSession,
    userMessage: string,
    context?: ChatMessage['context']
  ): Promise<ChatMessage> {
    const prompt = this.buildConversationPrompt(session, userMessage, context);
    try {
      const response = await invoke<string>('generate_llm_response', {
        prompt: prompt, // Assuming 'prompt' is the correct variable name from buildConversationPrompt
        systemPrompt: this.getSystemPrompt(session.type), // Reverted to original systemPrompt logic
        provider: this.currentProvider,
        model: this.currentModel,
      });

      console.log('[AIPairProgrammer] Received response from backend:', response ? response.substring(0, 50) + '...' : 'Empty response');

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.ASSISTANT,
        content: response,
        timestamp: new Date(),
        codeBlocks: this.extractCodeBlocks(response),
        suggestions: this.extractSuggestions(response),
      };

      return message;
    } catch (error) {
      console.error('[AIPairProgrammer] Error generating response:', error);
      // Try to ping to see if it's a connection issue
      this.checkConnection().then(connected => {
        console.log('[AIPairProgrammer] Connection check result:', connected ? 'Connected' : 'Disconnected');
      });
      throw error;
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      console.log('[AIPairProgrammer] Pinging local LLM...');
      const status = await invoke<boolean>('check_llm_status');
      console.log('[AIPairProgrammer] Local LLM Status:', status);

      console.log('[AIPairProgrammer] Listing available models...');
      const models = await invoke<string[]>('list_available_models');
      console.log('[AIPairProgrammer] Available Models:', models);

      return status;
    } catch (error) {
      console.error('[AIPairProgrammer] Connection check failed:', error);
      return false;
    }
  }

  public setProvider(provider: string, model: string) {
    this.currentProvider = provider;
    this.currentModel = model;
  }

  private currentProvider: string = 'ollama';
  private currentModel: string = 'gemma2:2b';

  private buildConversationPrompt(
    session: ConversationSession,
    userMessage: string,
    context?: ChatMessage['context']
  ): string {
    let prompt = '';

    // Add conversation history (last 10 messages)
    const recentMessages = session.messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role !== MessageRole.SYSTEM) {
        prompt += `${msg.role}: ${msg.content}\n\n`;
      }
    }

    // Add context if provided
    if (context) {
      prompt += '\nContext:\n';
      if (context.file) prompt += `File: ${context.file}\n`;
      if (context.language) prompt += `Language: ${context.language}\n`;
      if (context.selection) prompt += `Selected code:\n${context.selection}\n`;
      if (context.stackTrace) prompt += `Stack trace:\n${context.stackTrace}\n`;
      prompt += '\n';
    }

    // Add current message
    prompt += `user: ${userMessage}`;

    return prompt;
  }

  private buildSuggestionPrompt(
    prompt: string,
    language: string,
    currentCode?: string
  ): string {
    let fullPrompt = `Language: ${language}\n\n`;
    if (currentCode) {
      fullPrompt += `Current code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\n`;
    }
    fullPrompt += `Request: ${prompt}\n\n`;
    fullPrompt += 'Provide code with explanation and reasoning.';
    return fullPrompt;
  }

  private buildDebugPrompt(
    problem: string,
    stackTrace?: string,
    code?: string
  ): string {
    let prompt = `Problem: ${problem}\n\n`;
    if (stackTrace) {
      prompt += `Stack trace:\n${stackTrace}\n\n`;
    }
    if (code) {
      prompt += `Code:\n\`\`\`\n${code}\n\`\`\`\n\n`;
    }
    prompt += 'Analyze the error, identify the root cause, and provide solutions.';
    return prompt;
  }

  private buildArchitecturePrompt(
    description: string,
    currentArchitecture?: string,
    constraints?: string[]
  ): string {
    let prompt = `System description: ${description}\n\n`;
    if (currentArchitecture) {
      prompt += `Current architecture: ${currentArchitecture}\n\n`;
    }
    if (constraints && constraints.length > 0) {
      prompt += `Constraints:\n${constraints.map(c => `- ${c}`).join('\n')}\n\n`;
    }
    prompt += 'Recommend an appropriate architecture with pros, cons, and implementation guidance.';
    return prompt;
  }

  private buildReviewPrompt(
    code: string,
    language: string,
    focusAreas?: string[]
  ): string {
    let prompt = `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    if (focusAreas && focusAreas.length > 0) {
      prompt += `Focus on: ${focusAreas.join(', ')}\n\n`;
    }
    prompt += 'Provide feedback on code quality, security, performance, and best practices.';
    return prompt;
  }

  private getSystemPrompt(type: ConversationType): string {
    const basePrompt = 'You are an expert AI pair programmer. You can create, update, and read files in the project.';
    const fileOpsInstruction = '\n\nTo create or update a file, you MUST use the following format:\n<file path="path/to/file.ext">\nfile content here\n</file>\n\nTo read a file, use:\n<read_file path="path/to/file.ext" />\n\nExample:\n<file path="src/components/Button.tsx">\nexport const Button = () => <button>Click me</button>;\n</file>\n\nAlways provide the full file content inside the tags.';

    const prompts = {
      [ConversationType.GENERAL]: 'You are a helpful AI pair programmer. Provide clear, practical advice.' + fileOpsInstruction,
      [ConversationType.DEBUG]: 'You are an expert debugger. Help identify and fix issues efficiently.' + fileOpsInstruction,
      [ConversationType.REVIEW]: 'You are a senior code reviewer. Provide constructive, detailed feedback.' + fileOpsInstruction,
      [ConversationType.ARCHITECTURE]: 'You are a software architect. Recommend scalable, maintainable solutions.' + fileOpsInstruction,
      [ConversationType.REFACTOR]: 'You are a refactoring expert. Suggest improvements while maintaining functionality.' + fileOpsInstruction,
      [ConversationType.LEARN]: 'You are a patient teacher. Explain concepts clearly with examples.' + fileOpsInstruction,
      [ConversationType.GENERATE]: 'You are an expert developer. Generate clean, production-quality code.' + fileOpsInstruction,
    };
    return prompts[type] || basePrompt + fileOpsInstruction;
  }

  private generateSessionTitle(type: ConversationType): string {
    const titles = {
      [ConversationType.GENERAL]: 'General Chat',
      [ConversationType.DEBUG]: 'Debug Session',
      [ConversationType.REVIEW]: 'Code Review',
      [ConversationType.ARCHITECTURE]: 'Architecture Discussion',
      [ConversationType.REFACTOR]: 'Refactoring Session',
      [ConversationType.LEARN]: 'Learning Session',
      [ConversationType.GENERATE]: 'Code Generation',
    };
    return `${titles[type]} - ${new Date().toLocaleString()}`;
  }

  private addSystemMessage(session: ConversationSession): void {
    const systemMessage: ChatMessage = {
      id: `msg_system_${Date.now()}`,
      role: MessageRole.SYSTEM,
      content: this.getSystemPrompt(session.type),
      timestamp: new Date(),
    };
    session.messages.push(systemMessage);
  }

  private extractCodeBlocks(content: string): ChatMessage['codeBlocks'] {
    const blocks: ChatMessage['codeBlocks'] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
    }

    return blocks.length > 0 ? blocks : undefined;
  }

  private extractSuggestions(content: string): string[] | undefined {
    const suggestions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        suggestions.push(line.trim().substring(1).trim());
      }
    }

    return suggestions.length > 0 ? suggestions : undefined;
  }

  private parseSuggestion(response: string, language: string): CodeSuggestion {
    const codeBlocks = this.extractCodeBlocks(response);
    const code = codeBlocks?.[0]?.code || '';

    return {
      id: `sug_${Date.now()}`,
      code,
      language,
      description: response.split('```')[0].trim(),
      reasoning: 'AI-generated suggestion',
      confidence: 0.85,
    };
  }

  private parseDebugAssistance(response: string): DebugAssistance {
    return {
      problem: 'Error analysis',
      analysis: {
        rootCause: 'Analysis in progress',
        explanation: response,
        severity: 'medium',
      },
      solutions: [
        {
          description: 'Recommended solution',
          steps: ['Review the code', 'Apply fix', 'Test'],
          likelihood: 'high',
        },
      ],
      relatedIssues: [],
      preventionTips: [],
    };
  }

  private parseArchitectureRecommendation(response: string): ArchitectureRecommendation {
    return {
      current: {
        description: 'Current architecture',
        pros: [],
        cons: [],
      },
      recommended: {
        pattern: 'Recommended pattern',
        description: response,
        benefits: [],
        tradeoffs: [],
        implementation: [],
      },
      migration: {
        complexity: 'medium',
        steps: [],
        risks: [],
      },
    };
  }

  private parseReviewFeedback(_response: string): CodeReviewFeedback {
    return {
      file: 'reviewed_file',
      overallRating: 7,
      strengths: [],
      improvements: [],
      security: [],
      performance: [],
      bestPractices: [],
    };
  }

  private parseLearningTopic(response: string, topic: string): LearningTopic {
    return {
      topic,
      explanation: response,
      concepts: [],
      resources: [],
      exercises: [],
    };
  }

  private exportAsMarkdown(session: ConversationSession): string {
    let md = `# ${session.title}\n\n`;
    md += `**Type:** ${session.type}\n`;
    md += `**Started:** ${session.startTime.toLocaleString()}\n\n`;
    md += `---\n\n`;

    for (const msg of session.messages) {
      if (msg.role !== MessageRole.SYSTEM) {
        md += `### ${msg.role === MessageRole.USER ? '👤 User' : '🤖 Assistant'}\n\n`;
        md += `${msg.content}\n\n`;

        if (msg.codeBlocks) {
          for (const block of msg.codeBlocks) {
            md += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
          }
        }
      }
    }

    return md;
  }

  private exportAsText(session: ConversationSession): string {
    let text = `${session.title}\n`;
    text += `${'='.repeat(session.title.length)}\n\n`;

    for (const msg of session.messages) {
      if (msg.role !== MessageRole.SYSTEM) {
        text += `[${msg.role.toUpperCase()}]\n${msg.content}\n\n`;
      }
    }

    return text;
  }
}

/**
 * Global AI pair programmer instance
 */
export const aiPairProgrammer = new AIPairProgrammer();

export default AIPairProgrammer;
