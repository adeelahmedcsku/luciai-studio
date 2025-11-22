/**
 * Package Manager UI System
 * Feature 122 - Visual interface for npm/yarn/pnpm with advanced features
 * 
 * Capabilities:
 * - Visual npm/yarn/pnpm interface
 * - Package search with ratings and downloads
 * - Dependency tree visualization
 * - Security audit display with severity levels
 * - Update manager with changelog preview
 * - Script runner
 * - Package.json editor
 * - Bulk operations
 * 
 * @module PackageManagerUI
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Supported package managers
 */
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  BUN = 'bun',
}

/**
 * Package information from registry
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  keywords: string[];
  downloads: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  versions: string[];
  latestVersion: string;
  publishedDate: Date;
  maintainers: Array<{
    name: string;
    email: string;
  }>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Installed package information
 */
export interface InstalledPackage {
  name: string;
  version: string;
  installedVersion: string;
  latestVersion: string;
  wanted: string;
  location: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
  isOutdated: boolean;
  hasVulnerabilities: boolean;
  vulnerabilityCount?: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

/**
 * Dependency tree node
 */
export interface DependencyTreeNode {
  name: string;
  version: string;
  path: string;
  dependencies: DependencyTreeNode[];
  isCircular: boolean;
  isDuplicate: boolean;
  size?: number;
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  description: string;
  affectedPackage: string;
  vulnerableVersions: string;
  patchedVersions: string;
  recommendation: string;
  cwe: string[];
  cvss: {
    score: number;
    vector: string;
  };
  references: string[];
  publishedDate: Date;
}

/**
 * Package update information
 */
export interface PackageUpdate {
  package: string;
  currentVersion: string;
  latestVersion: string;
  wantedVersion: string;
  updateType: 'major' | 'minor' | 'patch';
  changelog?: string;
  breaking: boolean;
  size: {
    current: number;
    new: number;
    diff: number;
  };
}

/**
 * Package script
 */
export interface PackageScript {
  name: string;
  command: string;
  description?: string;
  isRunning: boolean;
}

/**
 * Package search result
 */
export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: string;
  date: Date;
  links: {
    npm?: string;
    homepage?: string;
    repository?: string;
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  downloads: {
    weekly: number;
  };
}

/**
 * Package Manager UI class
 */
export class PackageManagerUI {
  private currentManager: PackageManager = PackageManager.NPM;
  private _installedPackages: InstalledPackage[] = [];
  private dependencyTree: DependencyTreeNode | null = null;
  private vulnerabilities: SecurityVulnerability[] = [];
  private runningScripts: Map<string, any> = new Map();

  /**
   * Detect available package managers
   */
  async detectPackageManagers(): Promise<PackageManager[]> {
    try {
      const available: PackageManager[] = [];
      
      for (const manager of Object.values(PackageManager)) {
        const isAvailable = await invoke<boolean>('check_package_manager', { manager });
        if (isAvailable) {
          available.push(manager as PackageManager);
        }
      }
      
      return available;
    } catch (error) {
      console.error('Failed to detect package managers:', error);
      return [PackageManager.NPM]; // Default to npm
    }
  }

  /**
   * Set current package manager
   */
  setPackageManager(manager: PackageManager): void {
    this.currentManager = manager;
  }

  /**
   * Get current package manager
   */
  getPackageManager(): PackageManager {
    return this.currentManager;
  }

  /**
   * Search packages in registry
   */
  async searchPackages(query: string, limit: number = 20): Promise<PackageSearchResult[]> {
    try {
      const results = await invoke<PackageSearchResult[]>('search_packages', {
        query,
        limit,
        manager: this.currentManager,
      });
      
      return results;
    } catch (error) {
      console.error('Package search failed:', error);
      return [];
    }
  }

  /**
   * Get package details from registry
   */
  async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    try {
      const info = await invoke<PackageInfo>('get_package_info', {
        package: packageName,
        manager: this.currentManager,
      });
      
      return info;
    } catch (error) {
      console.error('Failed to get package info:', error);
      return null;
    }
  }

  /**
   * List installed packages
   */
  async listInstalledPackages(): Promise<InstalledPackage[]> {
    try {
      const packages = await invoke<InstalledPackage[]>('list_installed_packages', {
        manager: this.currentManager,
      });
      
      this._installedPackages = packages;
      return packages;
    } catch (error) {
      console.error('Failed to list packages:', error);
      return [];
    }
  }

  /**
   * Install package
   */
  async installPackage(
    packageName: string,
    version?: string,
    isDev: boolean = false,
    isGlobal: boolean = false
  ): Promise<{ success: boolean; output: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string }>('install_package', {
        package: version ? `${packageName}@${version}` : packageName,
        manager: this.currentManager,
        dev: isDev,
        global: isGlobal,
      });
      
      // Refresh package list
      if (result.success) {
        await this.listInstalledPackages();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Installation failed',
      };
    }
  }

  /**
   * Uninstall package
   */
  async uninstallPackage(
    packageName: string,
    isGlobal: boolean = false
  ): Promise<{ success: boolean; output: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string }>('uninstall_package', {
        package: packageName,
        manager: this.currentManager,
        global: isGlobal,
      });
      
      // Refresh package list
      if (result.success) {
        await this.listInstalledPackages();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Uninstallation failed',
      };
    }
  }

  /**
   * Update package
   */
  async updatePackage(
    packageName: string,
    version?: string
  ): Promise<{ success: boolean; output: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string }>('update_package', {
        package: version ? `${packageName}@${version}` : packageName,
        manager: this.currentManager,
      });
      
      // Refresh package list
      if (result.success) {
        await this.listInstalledPackages();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Update all packages
   */
  async updateAllPackages(): Promise<{ success: boolean; output: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string }>('update_all_packages', {
        manager: this.currentManager,
      });
      
      // Refresh package list
      if (result.success) {
        await this.listInstalledPackages();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Check for outdated packages
   */
  async checkOutdated(): Promise<PackageUpdate[]> {
    try {
      const updates = await invoke<PackageUpdate[]>('check_outdated', {
        manager: this.currentManager,
      });
      
      return updates;
    } catch (error) {
      console.error('Failed to check outdated packages:', error);
      return [];
    }
  }

  /**
   * Build dependency tree
   */
  async buildDependencyTree(): Promise<DependencyTreeNode | null> {
    try {
      const tree = await invoke<DependencyTreeNode>('build_dependency_tree', {
        manager: this.currentManager,
      });
      
      this.dependencyTree = tree;
      return tree;
    } catch (error) {
      console.error('Failed to build dependency tree:', error);
      return null;
    }
  }

  /**
   * Get dependency tree
   */
  getDependencyTree(): DependencyTreeNode | null {
    return this.dependencyTree;
  }

  /**
   * Run security audit
   */
  async runSecurityAudit(): Promise<SecurityVulnerability[]> {
    try {
      const vulnerabilities = await invoke<SecurityVulnerability[]>('run_security_audit', {
        manager: this.currentManager,
      });
      
      this.vulnerabilities = vulnerabilities;
      return vulnerabilities;
    } catch (error) {
      console.error('Security audit failed:', error);
      return [];
    }
  }

  /**
   * Get security vulnerabilities
   */
  getVulnerabilities(): SecurityVulnerability[] {
    return this.vulnerabilities;
  }

  /**
   * Fix security vulnerabilities
   */
  async fixVulnerabilities(
    vulnerabilityIds?: string[]
  ): Promise<{ success: boolean; output: string; fixed: number }> {
    try {
      const result = await invoke<{ success: boolean; output: string; fixed: number }>('fix_vulnerabilities', {
        manager: this.currentManager,
        ids: vulnerabilityIds,
      });
      
      // Refresh vulnerability list
      if (result.success) {
        await this.runSecurityAudit();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Fix failed',
        fixed: 0,
      };
    }
  }

  /**
   * Get package scripts from package.json
   */
  async getPackageScripts(): Promise<PackageScript[]> {
    try {
      const scripts = await invoke<PackageScript[]>('get_package_scripts');
      return scripts;
    } catch (error) {
      console.error('Failed to get scripts:', error);
      return [];
    }
  }

  /**
   * Run package script
   */
  async runScript(scriptName: string): Promise<string> {
    try {
      const scriptId = `${scriptName}_${Date.now()}`;
      
      const result = await invoke<string>('run_package_script', {
        script: scriptName,
        manager: this.currentManager,
      });
      
      this.runningScripts.set(scriptId, {
        name: scriptName,
        startTime: new Date(),
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to run script ${scriptName}: ${error}`);
    }
  }

  /**
   * Stop running script
   */
  async stopScript(scriptName: string): Promise<void> {
    try {
      await invoke('stop_package_script', { script: scriptName });
      
      // Remove from running scripts
      for (const [id, script] of this.runningScripts.entries()) {
        if (script.name === scriptName) {
          this.runningScripts.delete(id);
        }
      }
    } catch (error) {
      console.error('Failed to stop script:', error);
    }
  }

  /**
   * Get package size information
   */
  async getPackageSize(packageName: string, version?: string): Promise<{
    packageSize: number;
    unpackedSize: number;
    dependencies: number;
  } | null> {
    try {
      const size = await invoke<{
        packageSize: number;
        unpackedSize: number;
        dependencies: number;
      }>('get_package_size', {
        package: version ? `${packageName}@${version}` : packageName,
      });
      
      return size;
    } catch (error) {
      console.error('Failed to get package size:', error);
      return null;
    }
  }

  /**
   * Get package changelog
   */
  async getPackageChangelog(
    packageName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string | null> {
    try {
      const changelog = await invoke<string>('get_package_changelog', {
        package: packageName,
        from: fromVersion,
        to: toVersion,
      });
      
      return changelog;
    } catch (error) {
      console.error('Failed to get changelog:', error);
      return null;
    }
  }

  /**
   * Clean package cache
   */
  async cleanCache(): Promise<{ success: boolean; output: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string }>('clean_package_cache', {
        manager: this.currentManager,
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Clean failed',
      };
    }
  }

  /**
   * Deduplicate packages
   */
  async deduplicatePackages(): Promise<{ success: boolean; output: string; saved: number }> {
    try {
      const result = await invoke<{ success: boolean; output: string; saved: number }>('deduplicate_packages', {
        manager: this.currentManager,
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Deduplication failed',
        saved: 0,
      };
    }
  }

  /**
   * Analyze package bundle size impact
   */
  async analyzeBundleSize(packageName: string): Promise<{
    size: number;
    gzipSize: number;
    dependencies: Array<{ name: string; size: number }>;
    treeshake: boolean;
  } | null> {
    try {
      const analysis = await invoke<{
        size: number;
        gzipSize: number;
        dependencies: Array<{ name: string; size: number }>;
        treeshake: boolean;
      }>('analyze_bundle_size', {
        package: packageName,
      });
      
      return analysis;
    } catch (error) {
      console.error('Bundle size analysis failed:', error);
      return null;
    }
  }

  /**
   * Find alternatives to a package
   */
  async findAlternatives(packageName: string): Promise<Array<{
    name: string;
    description: string;
    downloads: number;
    stars: number;
    size: number;
  }>> {
    try {
      const alternatives = await invoke<Array<{
        name: string;
        description: string;
        downloads: number;
        stars: number;
        size: number;
      }>>('find_package_alternatives', {
        package: packageName,
      });
      
      return alternatives;
    } catch (error) {
      console.error('Failed to find alternatives:', error);
      return [];
    }
  }

  /**
   * Generate package.json based on usage
   */
  async generatePackageJson(
    projectName: string,
    projectType: 'library' | 'application',
    framework?: string
  ): Promise<string> {
    const packageJson: any = {
      name: projectName,
      version: '1.0.0',
      description: '',
      main: projectType === 'library' ? 'dist/index.js' : 'src/index.js',
      scripts: {},
      keywords: [],
      author: '',
      license: 'MIT',
    };

    // Add framework-specific configurations
    if (framework) {
      switch (framework.toLowerCase()) {
        case 'react':
          packageJson.scripts = {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject',
          };
          packageJson.dependencies = {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          };
          packageJson.devDependencies = {
            'react-scripts': '^5.0.1',
          };
          break;

        case 'vue':
          packageJson.scripts = {
            serve: 'vue-cli-service serve',
            build: 'vue-cli-service build',
            lint: 'vue-cli-service lint',
          };
          packageJson.dependencies = {
            vue: '^3.3.0',
          };
          packageJson.devDependencies = {
            '@vue/cli-service': '^5.0.0',
          };
          break;

        case 'express':
          packageJson.scripts = {
            start: 'node src/index.js',
            dev: 'nodemon src/index.js',
            test: 'jest',
          };
          packageJson.dependencies = {
            express: '^4.18.0',
          };
          packageJson.devDependencies = {
            nodemon: '^3.0.0',
            jest: '^29.0.0',
          };
          break;
      }
    }

    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * Validate package.json
   */
  async validatePackageJson(content: string): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
  }> {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    try {
      const packageJson = JSON.parse(content);

      // Required fields
      if (!packageJson.name) {
        errors.push({ field: 'name', message: 'Package name is required' });
      }
      if (!packageJson.version) {
        errors.push({ field: 'version', message: 'Version is required' });
      }

      // Warnings for missing recommended fields
      if (!packageJson.description) {
        warnings.push({ field: 'description', message: 'Description is recommended' });
      }
      if (!packageJson.repository) {
        warnings.push({ field: 'repository', message: 'Repository URL is recommended' });
      }
      if (!packageJson.license) {
        warnings.push({ field: 'license', message: 'License is recommended' });
      }

      // Validate version format
      if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
        errors.push({ field: 'version', message: 'Invalid version format' });
      }

      // Check for deprecated packages
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [pkg, _version] of Object.entries(dependencies)) {
        // This would need actual deprecation data
        // Just a placeholder example
        if (pkg === 'request') {
          warnings.push({
            field: 'dependencies',
            message: `Package "${pkg}" is deprecated`,
          });
        }
      }

    } catch (error) {
      errors.push({ field: 'json', message: 'Invalid JSON format' });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format package size for display
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get severity color for vulnerabilities
   */
  getSeverityColor(severity: string): string {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      moderate: '#f59e0b',
      low: '#84cc16',
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  }
}

/**
 * Global package manager UI instance
 */
export const packageManagerUI = new PackageManagerUI();

export default PackageManagerUI;
