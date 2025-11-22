/**
 * AI Code Migration Assistant
 * Feature 125 - Intelligent code migration and modernization
 * 
 * Capabilities:
 * - Framework migration (React → Vue, Angular → React, etc.)
 * - Language conversion (JavaScript → TypeScript, Python 2 → 3, etc.)
 * - API version upgrades (automatic code updates for new APIs)
 * - Dependency updates with code fixes
 * - Syntax modernization
 * - Best practices application
 * - Migration validation
 * - Rollback support
 * 
 * @module AICodeMigrator
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Migration types
 */
export enum MigrationType {
  FRAMEWORK = 'framework',
  LANGUAGE = 'language',
  API_VERSION = 'api_version',
  DEPENDENCY = 'dependency',
  SYNTAX = 'syntax',
  BEST_PRACTICES = 'best_practices',
}

/**
 * Framework migration paths
 */
export enum FrameworkMigration {
  REACT_TO_VUE = 'react_to_vue',
  VUE_TO_REACT = 'vue_to_react',
  ANGULAR_TO_REACT = 'angular_to_react',
  REACT_TO_ANGULAR = 'react_to_angular',
  JQUERY_TO_REACT = 'jquery_to_react',
  CLASS_TO_HOOKS = 'class_to_hooks',
  EXPRESS_TO_FASTIFY = 'express_to_fastify',
  MOCHA_TO_JEST = 'mocha_to_jest',
}

/**
 * Language conversion paths
 */
export enum LanguageConversion {
  JS_TO_TS = 'js_to_ts',
  PYTHON2_TO_PYTHON3 = 'python2_to_python3',
  JAVA8_TO_JAVA17 = 'java8_to_java17',
  PHP7_TO_PHP8 = 'php7_to_php8',
  COMMONJS_TO_ESM = 'commonjs_to_esm',
  CALLBACKS_TO_PROMISES = 'callbacks_to_promises',
  PROMISES_TO_ASYNC_AWAIT = 'promises_to_async_await',
}

/**
 * Migration status
 */
export enum MigrationStatus {
  ANALYZING = 'analyzing',
  PLANNING = 'planning',
  MIGRATING = 'migrating',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Migration plan
 */
export interface MigrationPlan {
  id: string;
  type: MigrationType;
  source: string;
  target: string;
  files: Array<{
    path: string;
    changes: number;
    complexity: 'low' | 'medium' | 'high';
  }>;
  steps: MigrationStep[];
  estimatedTime: number; // minutes
  risks: string[];
  dependencies: string[];
  backupPath?: string;
}

/**
 * Migration step
 */
export interface MigrationStep {
  id: string;
  order: number;
  description: string;
  type: 'automated' | 'manual' | 'review';
  files: string[];
  changes: Array<{
    file: string;
    before: string;
    after: string;
    line: number;
    reason: string;
  }>;
  validation: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Migration result
 */
export interface MigrationResult {
  id: string;
  plan: MigrationPlan;
  status: MigrationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  filesModified: number;
  linesChanged: number;
  errors: MigrationError[];
  warnings: string[];
  recommendations: string[];
  rollbackAvailable: boolean;
}

/**
 * Migration error
 */
export interface MigrationError {
  file: string;
  line: number;
  message: string;
  type: 'syntax' | 'logic' | 'compatibility' | 'dependency';
  severity: 'error' | 'warning';
  suggestion?: string;
}

/**
 * Migration validation result
 */
export interface ValidationResult {
  passed: boolean;
  tests: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
  buildSuccess: boolean;
  runtimeErrors: string[];
  typeErrors: string[];
  lintErrors: string[];
}

/**
 * Dependency update info
 */
export interface DependencyUpdate {
  package: string;
  fromVersion: string;
  toVersion: string;
  breaking: boolean;
  changes: Array<{
    type: 'api_change' | 'removal' | 'deprecation' | 'addition';
    description: string;
    codeImpact: string[];
  }>;
  migration: {
    automated: boolean;
    steps: string[];
    codeChanges: number;
  };
}

/**
 * AI Code Migrator class
 */
export class AICodeMigrator {
  private activeMigrations: Map<string, MigrationResult> = new Map();
  private migrationHistory: MigrationResult[] = [];
  private backups: Map<string, string> = new Map();

  /**
   * Analyze codebase for migration
   */
  async analyzeMigration(
    files: Array<{ path: string; content: string }>,
    migrationType: MigrationType,
    source: string,
    target: string
  ): Promise<MigrationPlan> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(files, migrationType, source, target);
      
      const response = await invoke<string>('generate_llm_response', {
        prompt: analysisPrompt,
        systemPrompt: `You are an expert code migration specialist. Analyze code and create detailed migration plans.`,
      });

      const plan = this.parseMigrationPlan(response, migrationType, source, target, files);
      return plan;
    } catch (error) {
      throw new Error(`Migration analysis failed: ${error}`);
    }
  }

  /**
   * Migrate framework
   */
  async migrateFramework(
    files: Array<{ path: string; content: string }>,
    migration: FrameworkMigration
  ): Promise<MigrationResult> {
    const [source, target] = this.parseFrameworkMigration(migration);
    
    const plan = await this.analyzeMigration(
      files,
      MigrationType.FRAMEWORK,
      source,
      target
    );

    return this.executeMigration(plan, files);
  }

  /**
   * Convert language
   */
  async convertLanguage(
    files: Array<{ path: string; content: string }>,
    conversion: LanguageConversion
  ): Promise<MigrationResult> {
    const [source, target] = this.parseLanguageConversion(conversion);
    
    const plan = await this.analyzeMigration(
      files,
      MigrationType.LANGUAGE,
      source,
      target
    );

    return this.executeMigration(plan, files);
  }

  /**
   * Upgrade API version
   */
  async upgradeAPI(
    files: Array<{ path: string; content: string }>,
    apiName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationResult> {
    const plan = await this.analyzeMigration(
      files,
      MigrationType.API_VERSION,
      `${apiName}@${fromVersion}`,
      `${apiName}@${toVersion}`
    );

    return this.executeMigration(plan, files);
  }

  /**
   * Update dependencies with code migration
   */
  async updateDependencies(
    files: Array<{ path: string; content: string }>,
    updates: DependencyUpdate[]
  ): Promise<MigrationResult> {
    try {
      const planId = `dep_${Date.now()}`;
      
      // Create combined migration plan
      const plan: MigrationPlan = {
        id: planId,
        type: MigrationType.DEPENDENCY,
        source: 'current',
        target: 'updated',
        files: files.map(f => ({
          path: f.path,
          changes: 0,
          complexity: 'medium' as const,
        })),
        steps: [],
        estimatedTime: updates.length * 5,
        risks: this.identifyDependencyRisks(updates),
        dependencies: updates.map(u => u.package),
      };

      // Generate migration steps for each dependency
      for (const update of updates) {
        const steps = await this.generateDependencyMigrationSteps(update, files);
        plan.steps.push(...steps);
      }

      return this.executeMigration(plan, files);
    } catch (error) {
      throw new Error(`Dependency update failed: ${error}`);
    }
  }

  /**
   * Modernize syntax
   */
  async modernizeSyntax(
    files: Array<{ path: string; content: string }>,
    language: string
  ): Promise<MigrationResult> {
    const plan = await this.analyzeMigration(
      files,
      MigrationType.SYNTAX,
      `${language} (legacy)`,
      `${language} (modern)`
    );

    return this.executeMigration(plan, files);
  }

  /**
   * Apply best practices
   */
  async applyBestPractices(
    files: Array<{ path: string; content: string }>,
    framework: string
  ): Promise<MigrationResult> {
    const plan = await this.analyzeMigration(
      files,
      MigrationType.BEST_PRACTICES,
      `${framework} (current)`,
      `${framework} (best practices)`
    );

    return this.executeMigration(plan, files);
  }

  /**
   * Execute migration plan
   */
  private async executeMigration(
    plan: MigrationPlan,
    files: Array<{ path: string; content: string }>
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      id: plan.id,
      plan,
      status: MigrationStatus.ANALYZING,
      startTime: new Date(),
      filesModified: 0,
      linesChanged: 0,
      errors: [],
      warnings: [],
      recommendations: [],
      rollbackAvailable: false,
    };

    this.activeMigrations.set(plan.id, result);

    try {
      // Create backup
      result.status = MigrationStatus.PLANNING;
      await this.createBackup(plan.id, files);
      result.rollbackAvailable = true;

      // Execute each step
      result.status = MigrationStatus.MIGRATING;
      for (const step of plan.steps) {
        step.status = 'in_progress';
        
        try {
          await this.executeStep(step, files);
          step.status = 'completed';
          result.filesModified += step.files.length;
          result.linesChanged += step.changes.length;
        } catch (error) {
          step.status = 'failed';
          result.errors.push({
            file: step.files[0] || 'unknown',
            line: 0,
            message: error instanceof Error ? error.message : 'Step execution failed',
            type: 'logic',
            severity: 'error',
          });
        }
      }

      // Validate migration
      result.status = MigrationStatus.VALIDATING;
      const validation = await this.validateMigration(files);
      
      if (!validation.passed) {
        result.errors.push(...this.convertValidationErrors(validation));
      }

      // Complete or fail
      result.status = result.errors.length === 0
        ? MigrationStatus.COMPLETED
        : MigrationStatus.FAILED;
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();

      // Generate recommendations
      result.recommendations = await this.generatePostMigrationRecommendations(result);

    } catch (error) {
      result.status = MigrationStatus.FAILED;
      result.errors.push({
        file: 'migration',
        line: 0,
        message: error instanceof Error ? error.message : 'Migration failed',
        type: 'logic',
        severity: 'error',
      });
    }

    this.migrationHistory.unshift(result);
    this.activeMigrations.delete(plan.id);

    return result;
  }

  /**
   * Execute single migration step
   */
  private async executeStep(
    step: MigrationStep,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    if (step.type === 'automated') {
      // Apply automated changes
      for (const change of step.changes) {
        const file = files.find(f => f.path === change.file);
        if (file) {
          file.content = this.applyChange(file.content, change);
        }
      }
    }
    // Manual and review steps require user intervention
  }

  /**
   * Apply code change
   */
  private applyChange(
    content: string,
    change: MigrationStep['changes'][0]
  ): string {
    const lines = content.split('\n');
    if (change.line >= 0 && change.line < lines.length) {
      lines[change.line] = change.after;
    }
    return lines.join('\n');
  }

  /**
   * Validate migration
   */
  private async validateMigration(
    files: Array<{ path: string; content: string }>
  ): Promise<ValidationResult> {
    try {
      return await invoke<ValidationResult>('validate_migration', {
        files: files.map(f => ({ path: f.path, content: f.content })),
      });
    } catch (error) {
      return {
        passed: false,
        tests: [],
        buildSuccess: false,
        runtimeErrors: [error instanceof Error ? error.message : 'Validation failed'],
        typeErrors: [],
        lintErrors: [],
      };
    }
  }

  /**
   * Create backup before migration
   */
  private async createBackup(
    migrationId: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    try {
      const backupPath = await invoke<string>('create_migration_backup', {
        migrationId,
        files,
      });
      this.backups.set(migrationId, backupPath);
    } catch (error) {
      console.error('Backup creation failed:', error);
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(migrationId: string): Promise<boolean> {
    try {
      const backupPath = this.backups.get(migrationId);
      if (!backupPath) {
        throw new Error('No backup available for this migration');
      }

      await invoke('restore_migration_backup', {
        backupPath,
      });

      const result = this.migrationHistory.find(r => r.id === migrationId);
      if (result) {
        result.status = MigrationStatus.ROLLED_BACK;
      }

      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus(migrationId: string): MigrationResult | null {
    return this.activeMigrations.get(migrationId) || 
           this.migrationHistory.find(r => r.id === migrationId) ||
           null;
  }

  /**
   * Get all migrations
   */
  getMigrationHistory(): MigrationResult[] {
    return this.migrationHistory;
  }

  /**
   * Cancel active migration
   */
  async cancelMigration(migrationId: string): Promise<boolean> {
    const migration = this.activeMigrations.get(migrationId);
    if (!migration) return false;

    migration.status = MigrationStatus.FAILED;
    migration.errors.push({
      file: 'migration',
      line: 0,
      message: 'Migration cancelled by user',
      type: 'logic',
      severity: 'warning',
    });

    return this.rollbackMigration(migrationId);
  }

  /**
   * Generate migration preview
   */
  async generatePreview(
    plan: MigrationPlan,
    maxFiles: number = 10
  ): Promise<Array<{
    file: string;
    before: string;
    after: string;
    diff: string;
  }>> {
    const previews: Array<{
      file: string;
      before: string;
      after: string;
      diff: string;
    }> = [];

    // Get first N files from plan
    const filesToPreview = plan.files.slice(0, maxFiles);

    for (const fileInfo of filesToPreview) {
      const changes = plan.steps
        .flatMap(s => s.changes)
        .filter(c => c.file === fileInfo.path);

      if (changes.length > 0) {
        previews.push({
          file: fileInfo.path,
          before: changes[0].before,
          after: changes[0].after,
          diff: this.generateDiff(changes[0].before, changes[0].after),
        });
      }
    }

    return previews;
  }

  /**
   * Generate diff between two strings
   */
  private generateDiff(before: string, after: string): string {
    // Simple diff generation - would use a proper diff library in production
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    let diff = '';

    const maxLength = Math.max(beforeLines.length, afterLines.length);
    for (let i = 0; i < maxLength; i++) {
      const beforeLine = beforeLines[i] || '';
      const afterLine = afterLines[i] || '';

      if (beforeLine !== afterLine) {
        if (beforeLine) diff += `- ${beforeLine}\n`;
        if (afterLine) diff += `+ ${afterLine}\n`;
      } else {
        diff += `  ${beforeLine}\n`;
      }
    }

    return diff;
  }

  // Private helper methods

  private buildAnalysisPrompt(
    files: Array<{ path: string; content: string }>,
    type: MigrationType,
    source: string,
    target: string
  ): string {
    let prompt = `Analyze this codebase for migration from ${source} to ${target}.\n\n`;
    prompt += `Migration type: ${type}\n\n`;
    prompt += `Files to analyze:\n`;

    for (const file of files.slice(0, 10)) { // Limit to first 10 files
      prompt += `\nFile: ${file.path}\n`;
      prompt += `\`\`\`\n${file.content.substring(0, 1000)}\n\`\`\`\n`;
    }

    prompt += `\nProvide:\n`;
    prompt += `1. Required changes for each file\n`;
    prompt += `2. Migration steps in order\n`;
    prompt += `3. Potential risks\n`;
    prompt += `4. Dependencies that need updating\n`;
    prompt += `5. Estimated complexity\n`;

    return prompt;
  }

  private parseMigrationPlan(
    response: string,
    type: MigrationType,
    source: string,
    target: string,
    files: Array<{ path: string; content: string }>
  ): MigrationPlan {
    return {
      id: `mig_${Date.now()}`,
      type,
      source,
      target,
      files: files.map(f => ({
        path: f.path,
        changes: 0,
        complexity: 'medium',
      })),
      steps: this.parseSteps(response),
      estimatedTime: files.length * 5,
      risks: this.parseRisks(response),
      dependencies: this.parseDependencies(response),
    };
  }

  private parseSteps(response: string): MigrationStep[] {
    // Simplified parsing
    return [
      {
        id: 'step_1',
        order: 1,
        description: 'Update syntax',
        type: 'automated',
        files: [],
        changes: [],
        validation: [],
        status: 'pending',
      },
    ];
  }

  private parseRisks(response: string): string[] {
    const risks: string[] = [];
    const riskSection = response.match(/risks?:?\s*\n([^#]*)/i);
    if (riskSection) {
      const items = riskSection[1].match(/[-*]\s+(.+)/g) || [];
      risks.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
    }
    return risks;
  }

  private parseDependencies(response: string): string[] {
    const deps: string[] = [];
    const depSection = response.match(/dependencies:?\s*\n([^#]*)/i);
    if (depSection) {
      const items = depSection[1].match(/[-*]\s+(.+)/g) || [];
      deps.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
    }
    return deps;
  }

  private parseFrameworkMigration(migration: FrameworkMigration): [string, string] {
    const parts = migration.split('_to_');
    return [parts[0].replace(/_/g, ' '), parts[1].replace(/_/g, ' ')];
  }

  private parseLanguageConversion(conversion: LanguageConversion): [string, string] {
    const parts = conversion.split('_to_');
    return [parts[0].replace(/_/g, ' '), parts[1].replace(/_/g, ' ')];
  }

  private identifyDependencyRisks(updates: DependencyUpdate[]): string[] {
    const risks: string[] = [];
    
    const breakingCount = updates.filter(u => u.breaking).length;
    if (breakingCount > 0) {
      risks.push(`${breakingCount} breaking changes detected`);
    }

    return risks;
  }

  private async generateDependencyMigrationSteps(
    update: DependencyUpdate,
    files: Array<{ path: string; content: string }>
  ): Promise<MigrationStep[]> {
    const steps: MigrationStep[] = [];

    if (update.migration.automated) {
      steps.push({
        id: `dep_${update.package}_${Date.now()}`,
        order: steps.length + 1,
        description: `Update ${update.package} from ${update.fromVersion} to ${update.toVersion}`,
        type: 'automated',
        files: files.map(f => f.path),
        changes: [],
        validation: [`Run tests after ${update.package} update`],
        status: 'pending',
      });
    }

    return steps;
  }

  private convertValidationErrors(validation: ValidationResult): MigrationError[] {
    const errors: MigrationError[] = [];

    for (const error of validation.runtimeErrors) {
      errors.push({
        file: 'runtime',
        line: 0,
        message: error,
        type: 'logic',
        severity: 'error',
      });
    }

    for (const error of validation.typeErrors) {
      errors.push({
        file: 'type',
        line: 0,
        message: error,
        type: 'syntax',
        severity: 'error',
      });
    }

    return errors;
  }

  private async generatePostMigrationRecommendations(
    result: MigrationResult
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (result.errors.length > 0) {
      recommendations.push('Review and fix migration errors before deployment');
    }

    if (result.warnings.length > 0) {
      recommendations.push('Check migration warnings for potential issues');
    }

    recommendations.push('Run full test suite to verify functionality');
    recommendations.push('Update documentation to reflect changes');
    recommendations.push('Test in staging environment before production');

    return recommendations;
  }
}

/**
 * Global AI code migrator instance
 */
export const aiCodeMigrator = new AICodeMigrator();

export default AICodeMigrator;
