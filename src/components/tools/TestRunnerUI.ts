/**
 * Test Runner UI System
 * Feature 123 - Integrated testing interface with comprehensive test management
 * 
 * Capabilities:
 * - Jest/Vitest/PyTest/Mocha integration
 * - Live test results viewer with real-time updates
 * - Coverage reports with heat maps
 * - Test debugging integration
 * - Performance metrics and trends
 * - Test organization and filtering
 * - Snapshot management
 * - Parallel test execution
 * 
 * @module TestRunnerUI
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Supported test frameworks
 */
export enum TestFramework {
  JEST = 'jest',
  VITEST = 'vitest',
  PYTEST = 'pytest',
  MOCHA = 'mocha',
  JASMINE = 'jasmine',
  AVA = 'ava',
  TAPE = 'tape',
}

/**
 * Test status
 */
export enum TestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TODO = 'todo',
}

/**
 * Test result
 */
export interface TestResult {
  id: string;
  name: string;
  fullName: string;
  status: TestStatus;
  duration: number;
  error?: {
    message: string;
    stack: string;
    matcherResult?: any;
  };
  retries: number;
  location: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * Test suite
 */
export interface TestSuite {
  id: string;
  name: string;
  file: string;
  status: TestStatus;
  tests: TestResult[];
  duration: number;
  timestamp: Date;
}

/**
 * Test run summary
 */
export interface TestRunSummary {
  id: string;
  framework: TestFramework;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    todo: number;
  };
  suites: TestSuite[];
  coverage?: CoverageReport;
}

/**
 * Coverage report
 */
export interface CoverageReport {
  summary: {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
  };
  files: Record<string, FileCoverage>;
}

/**
 * Coverage metric
 */
export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  percentage: number;
}

/**
 * File coverage
 */
export interface FileCoverage {
  path: string;
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  uncoveredLines: number[];
  linesCoverage: Record<number, number>; // line number -> hit count
}

/**
 * Test configuration
 */
export interface TestConfiguration {
  framework: TestFramework;
  testMatch?: string[];
  testIgnore?: string[];
  coverage: boolean;
  coverageThreshold?: {
    lines?: number;
    statements?: number;
    functions?: number;
    branches?: number;
  };
  parallel: boolean;
  maxWorkers?: number;
  timeout: number;
  retries: number;
  verbose: boolean;
  bail: boolean;
  watch: boolean;
}

/**
 * Test filter
 */
export interface TestFilter {
  pattern?: string;
  file?: string;
  status?: TestStatus[];
  tags?: string[];
}

/**
 * Snapshot
 */
export interface Snapshot {
  id: string;
  testName: string;
  file: string;
  content: string;
  isOutdated: boolean;
  lastUpdated: Date;
}

/**
 * Test performance metrics
 */
export interface TestPerformanceMetrics {
  testName: string;
  runs: Array<{
    duration: number;
    timestamp: Date;
    passed: boolean;
  }>;
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Test Runner UI class
 */
export class TestRunnerUI {
  private currentFramework: TestFramework = TestFramework.JEST;
  private testRuns: TestRunSummary[] = [];
  private currentRun: TestRunSummary | null = null;
  private configuration: TestConfiguration;
  private isWatching: boolean = false;
  private performanceMetrics: Map<string, TestPerformanceMetrics> = new Map();

  constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  /**
   * Get default test configuration
   */
  private getDefaultConfiguration(): TestConfiguration {
    return {
      framework: TestFramework.JEST,
      coverage: true,
      parallel: true,
      timeout: 5000,
      retries: 0,
      verbose: false,
      bail: false,
      watch: false,
    };
  }

  /**
   * Detect available test frameworks
   */
  async detectFrameworks(): Promise<TestFramework[]> {
    try {
      const frameworks = await invoke<TestFramework[]>('detect_test_frameworks');
      return frameworks;
    } catch (error) {
      console.error('Failed to detect test frameworks:', error);
      return [];
    }
  }

  /**
   * Set current test framework
   */
  setFramework(framework: TestFramework): void {
    this.currentFramework = framework;
    this.configuration.framework = framework;
  }

  /**
   * Get current framework
   */
  getFramework(): TestFramework {
    return this.currentFramework;
  }

  /**
   * Update test configuration
   */
  updateConfiguration(config: Partial<TestConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): TestConfiguration {
    return this.configuration;
  }

  /**
   * Discover all tests
   */
  async discoverTests(): Promise<TestSuite[]> {
    try {
      const suites = await invoke<TestSuite[]>('discover_tests', {
        framework: this.currentFramework,
        config: this.configuration,
      });
      
      return suites;
    } catch (error) {
      console.error('Failed to discover tests:', error);
      return [];
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestRunSummary> {
    return this.runTests({});
  }

  /**
   * Run specific tests based on filter
   */
  async runTests(filter: TestFilter): Promise<TestRunSummary> {
    try {
      const runId = `run_${Date.now()}`;
      
      const summary: TestRunSummary = {
        id: runId,
        framework: this.currentFramework,
        startTime: new Date(),
        duration: 0,
        status: 'running',
        stats: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          todo: 0,
        },
        suites: [],
      };
      
      this.currentRun = summary;
      this.testRuns.unshift(summary);
      
      // Execute tests
      const result = await invoke<TestRunSummary>('run_tests', {
        framework: this.currentFramework,
        config: this.configuration,
        filter,
      });
      
      // Update summary
      Object.assign(summary, result);
      summary.endTime = new Date();
      summary.duration = summary.endTime.getTime() - summary.startTime.getTime();
      summary.status = 'completed';
      
      // Update performance metrics
      this.updatePerformanceMetrics(result);
      
      return summary;
    } catch (error) {
      if (this.currentRun) {
        this.currentRun.status = 'failed';
        this.currentRun.endTime = new Date();
      }
      throw error;
    }
  }

  /**
   * Run single test
   */
  async runSingleTest(testId: string): Promise<TestResult> {
    try {
      const result = await invoke<TestResult>('run_single_test', {
        framework: this.currentFramework,
        testId,
        config: this.configuration,
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to run test ${testId}: ${error}`);
    }
  }

  /**
   * Run tests in watch mode
   */
  async startWatchMode(filter?: TestFilter): Promise<void> {
    if (this.isWatching) {
      throw new Error('Watch mode is already running');
    }
    
    try {
      this.isWatching = true;
      
      await invoke('start_test_watch', {
        framework: this.currentFramework,
        config: { ...this.configuration, watch: true },
        filter,
      });
    } catch (error) {
      this.isWatching = false;
      throw error;
    }
  }

  /**
   * Stop watch mode
   */
  async stopWatchMode(): Promise<void> {
    if (!this.isWatching) {
      return;
    }
    
    try {
      await invoke('stop_test_watch', {
        framework: this.currentFramework,
      });
      
      this.isWatching = false;
    } catch (error) {
      console.error('Failed to stop watch mode:', error);
    }
  }

  /**
   * Get watch mode status
   */
  isInWatchMode(): boolean {
    return this.isWatching;
  }

  /**
   * Cancel current test run
   */
  async cancelTestRun(): Promise<void> {
    if (!this.currentRun || this.currentRun.status !== 'running') {
      return;
    }
    
    try {
      await invoke('cancel_test_run', {
        framework: this.currentFramework,
        runId: this.currentRun.id,
      });
      
      this.currentRun.status = 'cancelled';
      this.currentRun.endTime = new Date();
    } catch (error) {
      console.error('Failed to cancel test run:', error);
    }
  }

  /**
   * Get current test run
   */
  getCurrentRun(): TestRunSummary | null {
    return this.currentRun;
  }

  /**
   * Get test run history
   */
  getTestRunHistory(): TestRunSummary[] {
    return this.testRuns;
  }

  /**
   * Get test by ID
   */
  getTestById(testId: string): TestResult | null {
    if (!this.currentRun) return null;
    
    for (const suite of this.currentRun.suites) {
      const test = suite.tests.find(t => t.id === testId);
      if (test) return test;
    }
    
    return null;
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport(): Promise<CoverageReport | null> {
    try {
      const report = await invoke<CoverageReport>('generate_coverage_report', {
        framework: this.currentFramework,
        config: this.configuration,
      });
      
      return report;
    } catch (error) {
      console.error('Failed to generate coverage report:', error);
      return null;
    }
  }

  /**
   * Export coverage report
   */
  async exportCoverageReport(
    format: 'html' | 'lcov' | 'json' | 'text',
    outputPath: string
  ): Promise<boolean> {
    try {
      await invoke('export_coverage_report', {
        framework: this.currentFramework,
        format,
        outputPath,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to export coverage report:', error);
      return false;
    }
  }

  /**
   * Get uncovered lines for a file
   */
  getUncoveredLines(filePath: string): number[] {
    if (!this.currentRun?.coverage) return [];
    
    const fileCoverage = this.currentRun.coverage.files[filePath];
    return fileCoverage?.uncoveredLines || [];
  }

  /**
   * Get coverage percentage for a file
   */
  getFileCoveragePercentage(filePath: string): number {
    if (!this.currentRun?.coverage) return 0;
    
    const fileCoverage = this.currentRun.coverage.files[filePath];
    if (!fileCoverage) return 0;
    
    return fileCoverage.lines.percentage;
  }

  /**
   * Get coverage heat map data
   */
  getCoverageHeatMap(): Array<{
    file: string;
    coverage: number;
    uncoveredCount: number;
  }> {
    if (!this.currentRun?.coverage) return [];
    
    return Object.entries(this.currentRun.coverage.files).map(([file, coverage]) => ({
      file,
      coverage: coverage.lines.percentage,
      uncoveredCount: coverage.uncoveredLines.length,
    }));
  }

  /**
   * List all snapshots
   */
  async listSnapshots(): Promise<Snapshot[]> {
    try {
      const snapshots = await invoke<Snapshot[]>('list_snapshots', {
        framework: this.currentFramework,
      });
      
      return snapshots;
    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Update snapshot
   */
  async updateSnapshot(snapshotId: string): Promise<boolean> {
    try {
      await invoke('update_snapshot', {
        framework: this.currentFramework,
        snapshotId,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to update snapshot:', error);
      return false;
    }
  }

  /**
   * Update all outdated snapshots
   */
  async updateAllSnapshots(): Promise<number> {
    try {
      const updated = await invoke<number>('update_all_snapshots', {
        framework: this.currentFramework,
      });
      
      return updated;
    } catch (error) {
      console.error('Failed to update snapshots:', error);
      return 0;
    }
  }

  /**
   * Debug test
   */
  async debugTest(testId: string): Promise<void> {
    try {
      await invoke('debug_test', {
        framework: this.currentFramework,
        testId,
        config: this.configuration,
      });
    } catch (error) {
      throw new Error(`Failed to debug test ${testId}: ${error}`);
    }
  }

  /**
   * Get test performance metrics
   */
  getPerformanceMetrics(testName?: string): TestPerformanceMetrics | TestPerformanceMetrics[] {
    if (testName) {
      return this.performanceMetrics.get(testName) || {
        testName,
        runs: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }
    
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(summary: TestRunSummary): void {
    for (const suite of summary.suites) {
      for (const test of suite.tests) {
        const fullName = `${suite.name}.${test.name}`;
        let metrics = this.performanceMetrics.get(fullName);
        
        if (!metrics) {
          metrics = {
            testName: fullName,
            runs: [],
            average: 0,
            min: 0,
            max: 0,
            trend: 'stable',
          };
          this.performanceMetrics.set(fullName, metrics);
        }
        
        // Add new run
        metrics.runs.push({
          duration: test.duration,
          timestamp: new Date(),
          passed: test.status === TestStatus.PASSED,
        });
        
        // Keep only last 100 runs
        if (metrics.runs.length > 100) {
          metrics.runs = metrics.runs.slice(-100);
        }
        
        // Update statistics
        const durations = metrics.runs.map(r => r.duration);
        metrics.average = durations.reduce((a, b) => a + b, 0) / durations.length;
        metrics.min = Math.min(...durations);
        metrics.max = Math.max(...durations);
        
        // Calculate trend
        if (metrics.runs.length >= 10) {
          const recentAvg = durations.slice(-10).reduce((a, b) => a + b, 0) / 10;
          const oldAvg = durations.slice(0, -10).reduce((a, b) => a + b, 0) / (durations.length - 10);
          
          if (recentAvg < oldAvg * 0.9) {
            metrics.trend = 'improving';
          } else if (recentAvg > oldAvg * 1.1) {
            metrics.trend = 'degrading';
          } else {
            metrics.trend = 'stable';
          }
        }
      }
    }
  }

  /**
   * Get slow tests
   */
  getSlowTests(threshold: number = 1000): Array<{
    test: string;
    duration: number;
    suite: string;
  }> {
    if (!this.currentRun) return [];
    
    const slowTests: Array<{ test: string; duration: number; suite: string }> = [];
    
    for (const suite of this.currentRun.suites) {
      for (const test of suite.tests) {
        if (test.duration > threshold) {
          slowTests.push({
            test: test.name,
            duration: test.duration,
            suite: suite.name,
          });
        }
      }
    }
    
    return slowTests.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get flaky tests (tests that intermittently fail)
   */
  getFlakyTests(threshold: number = 0.2): Array<{
    test: string;
    failureRate: number;
    totalRuns: number;
  }> {
    const flakyTests: Array<{ test: string; failureRate: number; totalRuns: number }> = [];
    
    for (const [testName, metrics] of this.performanceMetrics.entries()) {
      const totalRuns = metrics.runs.length;
      if (totalRuns < 10) continue; // Need at least 10 runs
      
      const failures = metrics.runs.filter(r => !r.passed).length;
      const failureRate = failures / totalRuns;
      
      if (failureRate > threshold && failureRate < 0.8) {
        flakyTests.push({
          test: testName,
          failureRate,
          totalRuns,
        });
      }
    }
    
    return flakyTests.sort((a, b) => b.failureRate - a.failureRate);
  }

  /**
   * Generate test report
   */
  async generateTestReport(format: 'html' | 'json' | 'junit' | 'markdown'): Promise<string> {
    if (!this.currentRun) {
      throw new Error('No test run available to generate report');
    }
    
    try {
      const report = await invoke<string>('generate_test_report', {
        framework: this.currentFramework,
        summary: this.currentRun,
        format,
      });
      
      return report;
    } catch (error) {
      throw new Error(`Failed to generate test report: ${error}`);
    }
  }

  /**
   * Compare two test runs
   */
  compareTestRuns(runId1: string, runId2: string): {
    newTests: string[];
    removedTests: string[];
    improvedTests: string[];
    degradedTests: string[];
    newFailures: string[];
    fixedTests: string[];
  } {
    const run1 = this.testRuns.find(r => r.id === runId1);
    const run2 = this.testRuns.find(r => r.id === runId2);
    
    if (!run1 || !run2) {
      throw new Error('One or both test runs not found');
    }
    
    const getTestNames = (run: TestRunSummary) => {
      const names = new Set<string>();
      for (const suite of run.suites) {
        for (const test of suite.tests) {
          names.add(`${suite.name}.${test.name}`);
        }
      }
      return names;
    };
    
    const tests1 = getTestNames(run1);
    const tests2 = getTestNames(run2);
    
    const newTests = Array.from(tests2).filter(t => !tests1.has(t));
    const removedTests = Array.from(tests1).filter(t => !tests2.has(t));
    
    const improvedTests: string[] = [];
    const degradedTests: string[] = [];
    const newFailures: string[] = [];
    const fixedTests: string[] = [];
    
    // Compare common tests
    for (const testName of tests1) {
      if (!tests2.has(testName)) continue;
      
      const metrics = this.performanceMetrics.get(testName);
      if (!metrics || metrics.runs.length < 2) continue;
      
      // Find runs in both summaries
      const [_suite1, _test1] = testName.split('.');
      const [_suite2, _test2] = testName.split('.');
      
      // This is simplified - would need actual implementation
    }
    
    return {
      newTests,
      removedTests,
      improvedTests,
      degradedTests,
      newFailures,
      fixedTests,
    };
  }

  /**
   * Format duration for display
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: TestStatus): string {
    const colors = {
      pending: '#6b7280',
      running: '#3b82f6',
      passed: '#10b981',
      failed: '#ef4444',
      skipped: '#f59e0b',
      todo: '#8b5cf6',
    };
    return colors[status];
  }

  /**
   * Get coverage color based on percentage
   */
  getCoverageColor(percentage: number): string {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    if (percentage >= 40) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  }
}

/**
 * Global test runner UI instance
 */
export const testRunnerUI = new TestRunnerUI();

export default TestRunnerUI;
