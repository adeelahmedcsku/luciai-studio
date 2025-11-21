import { invoke } from "@tauri-apps/api/core";
import { toast } from "../components/ui/NotificationToast";

export interface TestResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface TestRunResult {
  success: boolean;
  suites: TestSuite[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
}

/**
 * Run tests using the project's test runner
 */
export async function runTests(
  projectPath: string,
  options: {
    pattern?: string;
    watch?: boolean;
    coverage?: boolean;
  } = {}
): Promise<TestRunResult> {
  try {
    // Detect test runner
    const testRunner = await detectTestRunner(projectPath);

    if (!testRunner) {
      toast.error("No test runner found", "Install Jest, Vitest, or another test framework");
      return createEmptyResult();
    }

    // Build test command
    const args = buildTestCommand(testRunner, options);

    toast.info("Running tests", "Please wait...");

    const result = await invoke<{
      stdout: string;
      stderr: string;
      exit_code: number;
      success: boolean;
    }>("execute_command", {
      request: {
        command: testRunner.command,
        args,
        working_dir: projectPath,
      },
    });

    const testResult = parseTestOutput(result.stdout, testRunner.type);

    if (testResult.failed === 0) {
      toast.success("Tests passed", `${testResult.passed}/${testResult.totalTests} passed`);
    } else {
      toast.error("Tests failed", `${testResult.failed}/${testResult.totalTests} failed`);
    }

    return testResult;
  } catch (error) {
    console.error("Test run error:", error);
    toast.error("Test run failed", error as string);
    return createEmptyResult();
  }
}

/**
 * Detect which test runner is available
 */
async function detectTestRunner(
  projectPath: string
): Promise<{ command: string; type: "jest" | "vitest" | "mocha" } | null> {
  try {
    // Check package.json for test script and dependencies
    const packageJson = await invoke<string>("read_file", {
      path: `${projectPath}/package.json`,
    });

    const pkg = JSON.parse(packageJson);

    // Check for Vitest
    if (
      pkg.devDependencies?.vitest ||
      pkg.dependencies?.vitest ||
      pkg.scripts?.test?.includes("vitest")
    ) {
      return { command: "npm", type: "vitest" };
    }

    // Check for Jest
    if (
      pkg.devDependencies?.jest ||
      pkg.dependencies?.jest ||
      pkg.scripts?.test?.includes("jest")
    ) {
      return { command: "npm", type: "jest" };
    }

    // Check for Mocha
    if (
      pkg.devDependencies?.mocha ||
      pkg.dependencies?.mocha ||
      pkg.scripts?.test?.includes("mocha")
    ) {
      return { command: "npm", type: "mocha" };
    }

    // Default to npm test
    if (pkg.scripts?.test) {
      return { command: "npm", type: "jest" }; // Assume Jest as default
    }

    return null;
  } catch (error) {
    console.error("Error detecting test runner:", error);
    return null;
  }
}

/**
 * Build test command arguments
 */
function buildTestCommand(
  testRunner: { command: string; type: string },
  options: {
    pattern?: string;
    watch?: boolean;
    coverage?: boolean;
  }
): string[] {
  const args = ["test"];

  if (options.watch) {
    args.push("--", "--watch");
  }

  if (options.coverage) {
    args.push("--", "--coverage");
  }

  if (options.pattern) {
    args.push("--", options.pattern);
  }

  return args;
}

/**
 * Parse test output
 */
function parseTestOutput(
  output: string,
  type: "jest" | "vitest" | "mocha"
): TestRunResult {
  try {
    // Try to find JSON output first (if --json was used)
    const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
    if (jsonMatch) {
      return parseJSONOutput(jsonMatch[0]);
    }

    // Fall back to text parsing
    return parseTextOutput(output, type);
  } catch (error) {
    console.error("Error parsing test output:", error);
    return createEmptyResult();
  }
}

/**
 * Parse JSON test output
 */
function parseJSONOutput(jsonString: string): TestRunResult {
  try {
    const data = JSON.parse(jsonString);

    const suites: TestSuite[] = data.testResults?.map((suite: any) => ({
      name: suite.name || "Test Suite",
      tests: suite.assertionResults?.map((test: any) => ({
        name: test.title,
        status: test.status === "passed" ? "passed" : test.status === "failed" ? "failed" : "skipped",
        duration: test.duration || 0,
        error: test.failureMessages?.[0],
      })) || [],
      totalTests: suite.numPassingTests + suite.numFailingTests + suite.numPendingTests,
      passed: suite.numPassingTests || 0,
      failed: suite.numFailingTests || 0,
      skipped: suite.numPendingTests || 0,
      duration: suite.perfStats?.runtime || 0,
    })) || [];

    const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passed = suites.reduce((sum, suite) => sum + suite.passed, 0);
    const failed = suites.reduce((sum, suite) => sum + suite.failed, 0);
    const skipped = suites.reduce((sum, suite) => sum + suite.skipped, 0);
    const duration = suites.reduce((sum, suite) => sum + suite.duration, 0);

    return {
      success: failed === 0,
      suites,
      totalTests,
      passed,
      failed,
      skipped,
      duration,
    };
  } catch (error) {
    console.error("Error parsing JSON output:", error);
    return createEmptyResult();
  }
}

/**
 * Parse text test output
 */
function parseTextOutput(output: string, type: string): TestRunResult {
  const lines = output.split("\n");

  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Simple regex patterns for common test output formats
  for (const line of lines) {
    // Jest/Vitest format: "Tests: 1 passed, 1 total"
    const jestMatch = line.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?(?:,\s+(\d+)\s+total)?/i);
    if (jestMatch) {
      passed = parseInt(jestMatch[1]) || 0;
      failed = parseInt(jestMatch[2]) || 0;
      skipped = parseInt(jestMatch[3]) || 0;
      totalTests = parseInt(jestMatch[4]) || (passed + failed + skipped);
    }

    // Mocha format: "5 passing" or "2 failing"
    const mochaPassMatch = line.match(/(\d+)\s+passing/i);
    if (mochaPassMatch) {
      passed = parseInt(mochaPassMatch[1]);
    }

    const mochaFailMatch = line.match(/(\d+)\s+failing/i);
    if (mochaFailMatch) {
      failed = parseInt(mochaFailMatch[1]);
    }
  }

  if (totalTests === 0) {
    totalTests = passed + failed + skipped;
  }

  return {
    success: failed === 0,
    suites: [
      {
        name: "All Tests",
        tests: [],
        totalTests,
        passed,
        failed,
        skipped,
        duration: 0,
      },
    ],
    totalTests,
    passed,
    failed,
    skipped,
    duration: 0,
  };
}

/**
 * Create empty result
 */
function createEmptyResult(): TestRunResult {
  return {
    success: false,
    suites: [],
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  };
}

/**
 * Watch tests (run continuously on file changes)
 */
export async function watchTests(
  projectPath: string,
  onUpdate: (result: TestRunResult) => void
): Promise<() => void> {
  let isWatching = true;

  const runWatchMode = async () => {
    while (isWatching) {
      const result = await runTests(projectPath, { watch: false });
      onUpdate(result);

      // Wait a bit before next run
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  };

  runWatchMode();

  // Return stop function
  return () => {
    isWatching = false;
  };
}

/**
 * Generate test file template
 */
export function generateTestTemplate(
  fileName: string,
  type: "component" | "function" | "api"
): string {
  const testName = fileName.replace(/\.(tsx?|jsx?)$/, "");

  switch (type) {
    case "component":
      return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ${testName} from './${fileName}';

describe('${testName}', () => {
  it('renders correctly', () => {
    render(<${testName} />);
    expect(screen.getByText('${testName}')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<${testName} />);
    
    // Add interaction tests here
  });
});`;

    case "function":
      return `import { describe, it, expect } from 'vitest';
import { ${testName} } from './${fileName}';

describe('${testName}', () => {
  it('returns expected result', () => {
    const result = ${testName}(/* args */);
    expect(result).toBe(/* expected */);
  });

  it('handles edge cases', () => {
    // Add edge case tests here
  });
});`;

    case "api":
      return `import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('API: ${testName}', () => {
  it('GET returns 200', async () => {
    const response = await request(app).get('/api/${testName.toLowerCase()}');
    expect(response.status).toBe(200);
  });

  it('POST creates resource', async () => {
    const response = await request(app)
      .post('/api/${testName.toLowerCase()}')
      .send({ /* data */ });
    expect(response.status).toBe(201);
  });
});`;

    default:
      return "";
  }
}
