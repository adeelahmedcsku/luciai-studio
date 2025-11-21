/**
 * Framework Detection & Support System
 * IntelliJ Ultimate-style framework support:
 * - Automatic framework detection
 * - Framework-specific completions
 * - Template syntax support
 * - Component intelligence
 * - Configuration file support
 * - Build tool integration
 */

export enum FrameworkType {
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  NEXT_JS = 'nextjs',
  NUXT = 'nuxt',
  SPRING_BOOT = 'spring-boot',
  DJANGO = 'django',
  FLASK = 'flask',
  EXPRESS = 'express',
  NEST_JS = 'nestjs',
  LARAVEL = 'laravel',
  RUBY_ON_RAILS = 'rails',
  ASP_NET = 'aspnet',
}

export interface FrameworkInfo {
  type: FrameworkType;
  name: string;
  version?: string;
  configFiles: string[];
  detected: boolean;
  features: FrameworkFeatures;
}

export interface FrameworkFeatures {
  hasRouting: boolean;
  hasStateManagement: boolean;
  hasTypescript: boolean;
  hasTesting: boolean;
  buildTool?: string;
  packageManager?: string;
}

export interface ComponentInfo {
  name: string;
  path: string;
  type: 'functional' | 'class' | 'vue' | 'angular';
  props: PropInfo[];
  state?: StateInfo[];
  hooks?: HookInfo[];
  methods?: MethodInfo[];
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface StateInfo {
  name: string;
  type: string;
  initialValue?: string;
}

export interface HookInfo {
  name: string;
  dependencies: string[];
}

export interface MethodInfo {
  name: string;
  params: string[];
  returnType: string;
}

export class FrameworkSupportSystem {
  private detectedFrameworks: Map<string, FrameworkInfo> = new Map();
  private projectRoot: string = '';

  /**
   * Detect frameworks in project
   */
  public async detectFrameworks(projectPath: string): Promise<FrameworkInfo[]> {
    this.projectRoot = projectPath;
    const frameworks: FrameworkInfo[] = [];

    // Check package.json for JavaScript frameworks
    const jsFrameworks = await this.detectJavaScriptFrameworks(projectPath);
    frameworks.push(...jsFrameworks);

    // Check for Java frameworks
    const javaFrameworks = await this.detectJavaFrameworks(projectPath);
    frameworks.push(...javaFrameworks);

    // Check for Python frameworks
    const pythonFrameworks = await this.detectPythonFrameworks(projectPath);
    frameworks.push(...pythonFrameworks);

    // Check for PHP frameworks
    const phpFrameworks = await this.detectPHPFrameworks(projectPath);
    frameworks.push(...phpFrameworks);

    // Store detected frameworks
    frameworks.forEach(fw => {
      this.detectedFrameworks.set(fw.type, fw);
    });

    return frameworks;
  }

  /**
   * Detect JavaScript/TypeScript frameworks
   */
  private async detectJavaScriptFrameworks(projectPath: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    
    try {
      // Read package.json
      const packageJson = await this.readPackageJson(projectPath);
      if (!packageJson) return frameworks;

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // React
      if (deps['react']) {
        frameworks.push({
          type: FrameworkType.REACT,
          name: 'React',
          version: deps['react'],
          configFiles: ['package.json', 'tsconfig.json', '.babelrc'],
          detected: true,
          features: {
            hasRouting: !!deps['react-router-dom'],
            hasStateManagement: !!(deps['redux'] || deps['zustand'] || deps['recoil']),
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['jest'] || deps['vitest'] || deps['@testing-library/react']),
            buildTool: deps['vite'] ? 'vite' : deps['webpack'] ? 'webpack' : 'unknown',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Next.js
      if (deps['next']) {
        frameworks.push({
          type: FrameworkType.NEXT_JS,
          name: 'Next.js',
          version: deps['next'],
          configFiles: ['next.config.js', 'next.config.ts', 'package.json'],
          detected: true,
          features: {
            hasRouting: true,
            hasStateManagement: !!(deps['redux'] || deps['zustand']),
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['jest'] || deps['vitest']),
            buildTool: 'next',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Vue.js
      if (deps['vue']) {
        frameworks.push({
          type: FrameworkType.VUE,
          name: 'Vue.js',
          version: deps['vue'],
          configFiles: ['vue.config.js', 'vite.config.js', 'package.json'],
          detected: true,
          features: {
            hasRouting: !!deps['vue-router'],
            hasStateManagement: !!(deps['vuex'] || deps['pinia']),
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['@vue/test-utils'] || deps['vitest']),
            buildTool: deps['vite'] ? 'vite' : deps['@vue/cli-service'] ? 'vue-cli' : 'unknown',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Nuxt
      if (deps['nuxt']) {
        frameworks.push({
          type: FrameworkType.NUXT,
          name: 'Nuxt',
          version: deps['nuxt'],
          configFiles: ['nuxt.config.js', 'nuxt.config.ts'],
          detected: true,
          features: {
            hasRouting: true,
            hasStateManagement: true,
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['@nuxt/test-utils'] || deps['vitest']),
            buildTool: 'nuxt',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Angular
      if (deps['@angular/core']) {
        frameworks.push({
          type: FrameworkType.ANGULAR,
          name: 'Angular',
          version: deps['@angular/core'],
          configFiles: ['angular.json', 'tsconfig.json', 'package.json'],
          detected: true,
          features: {
            hasRouting: !!deps['@angular/router'],
            hasStateManagement: !!(deps['@ngrx/store'] || deps['@ngxs/store']),
            hasTypescript: true,
            hasTesting: !!deps['@angular/core'], // Angular includes testing
            buildTool: 'angular-cli',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Svelte
      if (deps['svelte']) {
        frameworks.push({
          type: FrameworkType.SVELTE,
          name: 'Svelte',
          version: deps['svelte'],
          configFiles: ['svelte.config.js', 'vite.config.js'],
          detected: true,
          features: {
            hasRouting: !!deps['svelte-routing'],
            hasStateManagement: !!deps['svelte/store'],
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['@testing-library/svelte'] || deps['vitest']),
            buildTool: 'vite',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // Express
      if (deps['express']) {
        frameworks.push({
          type: FrameworkType.EXPRESS,
          name: 'Express',
          version: deps['express'],
          configFiles: ['package.json', 'tsconfig.json'],
          detected: true,
          features: {
            hasRouting: true,
            hasStateManagement: false,
            hasTypescript: !!deps['typescript'],
            hasTesting: !!(deps['jest'] || deps['mocha'] || deps['supertest']),
            buildTool: deps['typescript'] ? 'tsc' : 'node',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

      // NestJS
      if (deps['@nestjs/core']) {
        frameworks.push({
          type: FrameworkType.NEST_JS,
          name: 'NestJS',
          version: deps['@nestjs/core'],
          configFiles: ['nest-cli.json', 'tsconfig.json', 'package.json'],
          detected: true,
          features: {
            hasRouting: true,
            hasStateManagement: false,
            hasTypescript: true,
            hasTesting: !!deps['@nestjs/testing'],
            buildTool: 'nest-cli',
            packageManager: this.detectPackageManager(projectPath),
          },
        });
      }

    } catch (error) {
      console.error('Error detecting JS frameworks:', error);
    }

    return frameworks;
  }

  /**
   * Detect Java frameworks
   */
  private async detectJavaFrameworks(projectPath: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];

    try {
      // Check for Spring Boot (pom.xml or build.gradle)
      const hasPom = await this.fileExists(`${projectPath}/pom.xml`);
      const hasGradle = await this.fileExists(`${projectPath}/build.gradle`);

      if (hasPom || hasGradle) {
        const content = hasPom 
          ? await this.readFile(`${projectPath}/pom.xml`)
          : await this.readFile(`${projectPath}/build.gradle`);

        if (content.includes('spring-boot')) {
          frameworks.push({
            type: FrameworkType.SPRING_BOOT,
            name: 'Spring Boot',
            version: this.extractVersion(content, 'spring-boot'),
            configFiles: hasPom ? ['pom.xml', 'application.properties'] : ['build.gradle', 'application.properties'],
            detected: true,
            features: {
              hasRouting: true,
              hasStateManagement: false,
              hasTypescript: false,
              hasTesting: content.includes('spring-boot-starter-test'),
              buildTool: hasPom ? 'maven' : 'gradle',
              packageManager: hasPom ? 'maven' : 'gradle',
            },
          });
        }
      }
    } catch (error) {
      console.error('Error detecting Java frameworks:', error);
    }

    return frameworks;
  }

  /**
   * Detect Python frameworks
   */
  private async detectPythonFrameworks(projectPath: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];

    try {
      // Check requirements.txt or pyproject.toml
      const hasRequirements = await this.fileExists(`${projectPath}/requirements.txt`);
      const hasPyproject = await this.fileExists(`${projectPath}/pyproject.toml`);

      if (hasRequirements) {
        const content = await this.readFile(`${projectPath}/requirements.txt`);

        // Django
        if (content.includes('Django')) {
          frameworks.push({
            type: FrameworkType.DJANGO,
            name: 'Django',
            version: this.extractVersion(content, 'Django'),
            configFiles: ['settings.py', 'manage.py', 'requirements.txt'],
            detected: true,
            features: {
              hasRouting: true,
              hasStateManagement: false,
              hasTypescript: false,
              hasTesting: true,
              buildTool: 'python',
              packageManager: 'pip',
            },
          });
        }

        // Flask
        if (content.includes('Flask')) {
          frameworks.push({
            type: FrameworkType.FLASK,
            name: 'Flask',
            version: this.extractVersion(content, 'Flask'),
            configFiles: ['app.py', 'requirements.txt', 'config.py'],
            detected: true,
            features: {
              hasRouting: true,
              hasStateManagement: false,
              hasTypescript: false,
              hasTesting: content.includes('pytest'),
              buildTool: 'python',
              packageManager: 'pip',
            },
          });
        }
      }
    } catch (error) {
      console.error('Error detecting Python frameworks:', error);
    }

    return frameworks;
  }

  /**
   * Detect PHP frameworks
   */
  private async detectPHPFrameworks(projectPath: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];

    try {
      // Check composer.json
      const hasComposer = await this.fileExists(`${projectPath}/composer.json`);
      
      if (hasComposer) {
        const content = await this.readFile(`${projectPath}/composer.json`);
        const composerData = JSON.parse(content);
        const deps = composerData.require || {};

        // Laravel
        if (deps['laravel/framework']) {
          frameworks.push({
            type: FrameworkType.LARAVEL,
            name: 'Laravel',
            version: deps['laravel/framework'],
            configFiles: ['composer.json', 'config/app.php', 'artisan'],
            detected: true,
            features: {
              hasRouting: true,
              hasStateManagement: false,
              hasTypescript: false,
              hasTesting: !!deps['phpunit/phpunit'],
              buildTool: 'composer',
              packageManager: 'composer',
            },
          });
        }
      }
    } catch (error) {
      console.error('Error detecting PHP frameworks:', error);
    }

    return frameworks;
  }

  /**
   * Get framework-specific completions
   */
  public getFrameworkCompletions(framework: FrameworkType, context: string): any[] {
    switch (framework) {
      case FrameworkType.REACT:
        return this.getReactCompletions(context);
      case FrameworkType.VUE:
        return this.getVueCompletions(context);
      case FrameworkType.ANGULAR:
        return this.getAngularCompletions(context);
      case FrameworkType.SPRING_BOOT:
        return this.getSpringBootCompletions(context);
      case FrameworkType.DJANGO:
        return this.getDjangoCompletions(context);
      default:
        return [];
    }
  }

  /**
   * React-specific completions
   */
  private getReactCompletions(context: string): any[] {
    return [
      { label: 'useState', kind: 'Function', detail: 'React Hook', insertText: 'useState(${1:initialValue})' },
      { label: 'useEffect', kind: 'Function', detail: 'React Hook', insertText: 'useEffect(() => {\n\t${1}\n}, [${2}])' },
      { label: 'useContext', kind: 'Function', detail: 'React Hook', insertText: 'useContext(${1:Context})' },
      { label: 'useReducer', kind: 'Function', detail: 'React Hook', insertText: 'useReducer(${1:reducer}, ${2:initialState})' },
      { label: 'useCallback', kind: 'Function', detail: 'React Hook', insertText: 'useCallback(() => {\n\t${1}\n}, [${2}])' },
      { label: 'useMemo', kind: 'Function', detail: 'React Hook', insertText: 'useMemo(() => ${1}, [${2}])' },
      { label: 'useRef', kind: 'Function', detail: 'React Hook', insertText: 'useRef(${1:null})' },
      { label: 'useImperativeHandle', kind: 'Function', detail: 'React Hook', insertText: 'useImperativeHandle' },
      { label: 'useLayoutEffect', kind: 'Function', detail: 'React Hook', insertText: 'useLayoutEffect' },
      { label: 'useDebugValue', kind: 'Function', detail: 'React Hook', insertText: 'useDebugValue' },
    ];
  }

  /**
   * Vue-specific completions
   */
  private getVueCompletions(context: string): any[] {
    return [
      { label: 'ref', kind: 'Function', detail: 'Vue Composition API', insertText: 'ref(${1:value})' },
      { label: 'reactive', kind: 'Function', detail: 'Vue Composition API', insertText: 'reactive(${1:object})' },
      { label: 'computed', kind: 'Function', detail: 'Vue Composition API', insertText: 'computed(() => ${1})' },
      { label: 'watch', kind: 'Function', detail: 'Vue Composition API', insertText: 'watch(() => ${1}, (${2:newVal}, ${3:oldVal}) => {\n\t${4}\n})' },
      { label: 'watchEffect', kind: 'Function', detail: 'Vue Composition API', insertText: 'watchEffect(() => {\n\t${1}\n})' },
      { label: 'onMounted', kind: 'Function', detail: 'Vue Lifecycle', insertText: 'onMounted(() => {\n\t${1}\n})' },
      { label: 'onUnmounted', kind: 'Function', detail: 'Vue Lifecycle', insertText: 'onUnmounted(() => {\n\t${1}\n})' },
      { label: 'onUpdated', kind: 'Function', detail: 'Vue Lifecycle', insertText: 'onUpdated(() => {\n\t${1}\n})' },
    ];
  }

  /**
   * Angular-specific completions
   */
  private getAngularCompletions(context: string): any[] {
    return [
      { label: '@Component', kind: 'Decorator', detail: 'Angular Decorator', insertText: '@Component({\n\tselector: \'${1}\',\n\ttemplateUrl: \'${2}\',\n\tstyleUrls: [\'${3}\']\n})' },
      { label: '@Injectable', kind: 'Decorator', detail: 'Angular Decorator', insertText: '@Injectable({\n\tprovidedIn: \'${1:root}\'\n})' },
      { label: '@Input', kind: 'Decorator', detail: 'Angular Decorator', insertText: '@Input() ${1:propertyName}' },
      { label: '@Output', kind: 'Decorator', detail: 'Angular Decorator', insertText: '@Output() ${1:eventName} = new EventEmitter()' },
      { label: '@ViewChild', kind: 'Decorator', detail: 'Angular Decorator', insertText: '@ViewChild(${1:selector}) ${2:propertyName}' },
      { label: 'ngOnInit', kind: 'Method', detail: 'Angular Lifecycle', insertText: 'ngOnInit(): void {\n\t${1}\n}' },
      { label: 'ngOnDestroy', kind: 'Method', detail: 'Angular Lifecycle', insertText: 'ngOnDestroy(): void {\n\t${1}\n}' },
    ];
  }

  /**
   * Spring Boot-specific completions
   */
  private getSpringBootCompletions(context: string): any[] {
    return [
      { label: '@RestController', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@RestController' },
      { label: '@RequestMapping', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@RequestMapping("${1:/api}")' },
      { label: '@GetMapping', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@GetMapping("${1:/path}")' },
      { label: '@PostMapping', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@PostMapping("${1:/path}")' },
      { label: '@PutMapping', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@PutMapping("${1:/path}")' },
      { label: '@DeleteMapping', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@DeleteMapping("${1:/path}")' },
      { label: '@Autowired', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@Autowired' },
      { label: '@Service', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@Service' },
      { label: '@Repository', kind: 'Annotation', detail: 'Spring Annotation', insertText: '@Repository' },
      { label: '@Entity', kind: 'Annotation', detail: 'JPA Annotation', insertText: '@Entity' },
    ];
  }

  /**
   * Django-specific completions
   */
  private getDjangoCompletions(context: string): any[] {
    return [
      { label: 'models.Model', kind: 'Class', detail: 'Django Model', insertText: 'models.Model' },
      { label: 'models.CharField', kind: 'Field', detail: 'Django Field', insertText: 'models.CharField(max_length=${1:100})' },
      { label: 'models.ForeignKey', kind: 'Field', detail: 'Django Field', insertText: 'models.ForeignKey(${1:Model}, on_delete=models.${2:CASCADE})' },
      { label: 'render', kind: 'Function', detail: 'Django View', insertText: 'render(request, \'${1:template.html}\', ${2:context})' },
      { label: 'redirect', kind: 'Function', detail: 'Django View', insertText: 'redirect(\'${1:view_name}\')' },
      { label: 'path', kind: 'Function', detail: 'Django URL', insertText: 'path(\'${1:route}\', ${2:view}, name=\'${3:name}\')' },
    ];
  }

  /**
   * Helper methods
   */

  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      const content = await this.readFile(`${projectPath}/package.json`);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private detectPackageManager(projectPath: string): string {
    // Check for lock files
    if (this.fileExistsSync(`${projectPath}/pnpm-lock.yaml`)) return 'pnpm';
    if (this.fileExistsSync(`${projectPath}/yarn.lock`)) return 'yarn';
    if (this.fileExistsSync(`${projectPath}/package-lock.json`)) return 'npm';
    return 'npm';
  }

  private extractVersion(content: string, packageName: string): string {
    const match = content.match(new RegExp(`${packageName}[=:>~^]*(\\d+\\.\\d+\\.\\d+)`));
    return match ? match[1] : 'unknown';
  }

  private async fileExists(path: string): Promise<boolean> {
    // Placeholder - would use actual file system API
    return false;
  }

  private fileExistsSync(path: string): boolean {
    // Placeholder - would use actual file system API
    return false;
  }

  private async readFile(path: string): Promise<string> {
    // Placeholder - would use actual file system API
    return '';
  }

  /**
   * Get all detected frameworks
   */
  public getDetectedFrameworks(): FrameworkInfo[] {
    return Array.from(this.detectedFrameworks.values());
  }

  /**
   * Get specific framework info
   */
  public getFramework(type: FrameworkType): FrameworkInfo | null {
    return this.detectedFrameworks.get(type) || null;
  }

  /**
   * Check if framework is detected
   */
  public hasFramework(type: FrameworkType): boolean {
    return this.detectedFrameworks.has(type);
  }
}

export default FrameworkSupportSystem;
