/**
 * Live Templates System
 * IntelliJ-style live templates (code snippets):
 * - Expandable code templates
 * - Template variables with smart defaults
 * - Context-aware activation
 * - Custom template creation
 * - Template groups/categories
 * - Import/export templates
 */

export interface LiveTemplate {
  id: string;
  abbreviation: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  applicableContexts: string[];
  group: string;
  enabled: boolean;
}

export interface TemplateVariable {
  name: string;
  expression?: string;
  defaultValue?: string;
  alwaysStopAt?: boolean;
}

export interface TemplateExpansionResult {
  text: string;
  cursorPosition?: { line: number; column: number };
  selections?: Array<{ start: number; end: number }>;
}

export class LiveTemplatesSystem {
  private templates: Map<string, LiveTemplate> = new Map();
  private groups: Map<string, string> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register all default templates
   */
  private registerDefaultTemplates() {
    // JavaScript/TypeScript templates
    this.registerTemplate({
      id: 'log',
      abbreviation: 'log',
      description: 'console.log statement',
      template: 'console.log(${1:message});${0}',
      variables: [{ name: '1', defaultValue: 'message' }],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'func',
      abbreviation: 'func',
      description: 'Function declaration',
      template: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}${0}',
      variables: [
        { name: '1', defaultValue: 'functionName' },
        { name: '2', defaultValue: '' },
        { name: '3', defaultValue: '// body' },
      ],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'arrow',
      abbreviation: 'arrow',
      description: 'Arrow function',
      template: 'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n};${0}',
      variables: [
        { name: '1', defaultValue: 'functionName' },
        { name: '2', defaultValue: '' },
        { name: '3', defaultValue: '// body' },
      ],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'async-arrow',
      abbreviation: 'afa',
      description: 'Async arrow function',
      template: 'const ${1:name} = async (${2:params}) => {\n\t${3:// body}\n};${0}',
      variables: [
        { name: '1', defaultValue: 'asyncFunction' },
        { name: '2', defaultValue: '' },
        { name: '3', defaultValue: '// body' },
      ],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'class',
      abbreviation: 'class',
      description: 'Class declaration',
      template: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3:// constructor}\n\t}\n\n\t${4:// methods}\n}${0}',
      variables: [
        { name: '1', defaultValue: 'ClassName' },
        { name: '2', defaultValue: '' },
      ],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'try-catch',
      abbreviation: 'try',
      description: 'Try-catch block',
      template: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:console.error(error);}\n}${0}',
      variables: [
        { name: '2', defaultValue: 'error' },
      ],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    this.registerTemplate({
      id: 'promise',
      abbreviation: 'promise',
      description: 'Promise',
      template: 'new Promise((resolve, reject) => {\n\t${1:// async code}\n\tresolve(${2:value});\n})${0}',
      variables: [],
      applicableContexts: ['javascript', 'typescript'],
      group: 'JavaScript',
      enabled: true,
    });

    // React templates
    this.registerTemplate({
      id: 'rfc',
      abbreviation: 'rfc',
      description: 'React functional component',
      template: 'import React from \'react\';\n\ninterface ${1:ComponentName}Props {\n\t${2:// props}\n}\n\nconst ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (${3:props}) => {\n\treturn (\n\t\t<div>\n\t\t\t${4:// content}\n\t\t</div>\n\t);\n};\n\nexport default ${1:ComponentName};${0}',
      variables: [
        { name: '1', defaultValue: 'ComponentName' },
      ],
      applicableContexts: ['typescript', 'typescriptreact'],
      group: 'React',
      enabled: true,
    });

    this.registerTemplate({
      id: 'useState',
      abbreviation: 'us',
      description: 'useState hook',
      template: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});${0}',
      variables: [
        { name: '1', defaultValue: 'state' },
        { name: '2', defaultValue: 'null' },
      ],
      applicableContexts: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
      group: 'React',
      enabled: true,
    });

    this.registerTemplate({
      id: 'useEffect',
      abbreviation: 'ue',
      description: 'useEffect hook',
      template: 'useEffect(() => {\n\t${1:// effect}\n\t\n\treturn () => {\n\t\t${2:// cleanup}\n\t};\n}, [${3:dependencies}]);${0}',
      variables: [],
      applicableContexts: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
      group: 'React',
      enabled: true,
    });

    // Vue templates
    this.registerTemplate({
      id: 'vue-component',
      abbreviation: 'vcomp',
      description: 'Vue 3 component',
      template: '<template>\n\t<div>\n\t\t${1:// content}\n\t</div>\n</template>\n\n<script setup lang="ts">\nimport { ref } from \'vue\';\n\n${2:// script}\n</script>\n\n<style scoped>\n${3:// styles}\n</style>${0}',
      variables: [],
      applicableContexts: ['vue'],
      group: 'Vue',
      enabled: true,
    });

    this.registerTemplate({
      id: 'v-ref',
      abbreviation: 'vref',
      description: 'Vue ref',
      template: 'const ${1:name} = ref(${2:initialValue});${0}',
      variables: [
        { name: '1', defaultValue: 'value' },
        { name: '2', defaultValue: 'null' },
      ],
      applicableContexts: ['typescript', 'javascript'],
      group: 'Vue',
      enabled: true,
    });

    // Python templates
    this.registerTemplate({
      id: 'py-class',
      abbreviation: 'class',
      description: 'Python class',
      template: 'class ${1:ClassName}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}\n\t\n\tdef ${4:method_name}(self${5:, params}):\n\t\t${6:pass}${0}',
      variables: [
        { name: '1', defaultValue: 'ClassName' },
      ],
      applicableContexts: ['python'],
      group: 'Python',
      enabled: true,
    });

    this.registerTemplate({
      id: 'py-func',
      abbreviation: 'def',
      description: 'Python function',
      template: 'def ${1:function_name}(${2:params}):\n\t"""${3:Description}"""\n\t${4:pass}${0}',
      variables: [
        { name: '1', defaultValue: 'function_name' },
      ],
      applicableContexts: ['python'],
      group: 'Python',
      enabled: true,
    });

    this.registerTemplate({
      id: 'py-main',
      abbreviation: 'main',
      description: 'Python main block',
      template: 'if __name__ == "__main__":\n\t${1:main()}${0}',
      variables: [],
      applicableContexts: ['python'],
      group: 'Python',
      enabled: true,
    });

    // Java/Spring templates
    this.registerTemplate({
      id: 'spring-controller',
      abbreviation: 'scontroller',
      description: 'Spring REST Controller',
      template: '@RestController\n@RequestMapping("${1:/api}")\npublic class ${2:Controller} {\n\t\n\t@GetMapping("${3:/path}")\n\tpublic ResponseEntity<${4:Type}> ${5:methodName}() {\n\t\t${6:// implementation}\n\t\treturn ResponseEntity.ok(${7:result});\n\t}\n}${0}',
      variables: [
        { name: '2', defaultValue: 'Controller' },
      ],
      applicableContexts: ['java'],
      group: 'Spring',
      enabled: true,
    });

    this.registerTemplate({
      id: 'spring-service',
      abbreviation: 'sservice',
      description: 'Spring Service',
      template: '@Service\npublic class ${1:Service} {\n\t\n\t@Autowired\n\tprivate ${2:Repository} ${3:repository};\n\t\n\tpublic ${4:ReturnType} ${5:methodName}(${6:params}) {\n\t\t${7:// implementation}\n\t}\n}${0}',
      variables: [
        { name: '1', defaultValue: 'Service' },
      ],
      applicableContexts: ['java'],
      group: 'Spring',
      enabled: true,
    });

    // SQL templates
    this.registerTemplate({
      id: 'select',
      abbreviation: 'sel',
      description: 'SELECT statement',
      template: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};${0}',
      variables: [
        { name: '1', defaultValue: '*' },
      ],
      applicableContexts: ['sql'],
      group: 'SQL',
      enabled: true,
    });

    this.registerTemplate({
      id: 'insert',
      abbreviation: 'ins',
      description: 'INSERT statement',
      template: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});${0}',
      variables: [],
      applicableContexts: ['sql'],
      group: 'SQL',
      enabled: true,
    });

    // HTML templates
    this.registerTemplate({
      id: 'html5',
      abbreviation: 'html5',
      description: 'HTML5 boilerplate',
      template: '<!DOCTYPE html>\n<html lang="${1:en}">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${2:Document}</title>\n</head>\n<body>\n\t${3:// content}\n</body>\n</html>${0}',
      variables: [
        { name: '1', defaultValue: 'en' },
        { name: '2', defaultValue: 'Document' },
      ],
      applicableContexts: ['html'],
      group: 'HTML',
      enabled: true,
    });
  }

  /**
   * Register a template
   */
  public registerTemplate(template: LiveTemplate): void {
    this.templates.set(template.abbreviation, template);
    
    // Register group
    if (!this.groups.has(template.group)) {
      this.groups.set(template.group, template.group);
    }
  }

  /**
   * Get template by abbreviation
   */
  public getTemplate(abbreviation: string): LiveTemplate | null {
    return this.templates.get(abbreviation) || null;
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): LiveTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates for context
   */
  public getTemplatesForContext(context: string): LiveTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.enabled && t.applicableContexts.includes(context));
  }

  /**
   * Get templates by group
   */
  public getTemplatesByGroup(group: string): LiveTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.group === group);
  }

  /**
   * Get all groups
   */
  public getAllGroups(): string[] {
    return Array.from(this.groups.keys());
  }

  /**
   * Expand template
   */
  public expandTemplate(
    template: LiveTemplate,
    variables?: Record<string, string>
  ): TemplateExpansionResult {
    let text = template.template;
    const selections: Array<{ start: number; end: number }> = [];

    // Replace variables
    template.variables.forEach((variable, index) => {
      const value = variables?.[variable.name] || variable.defaultValue || '';
      const placeholder = `\${${variable.name}:${variable.defaultValue || ''}}`;
      const simpleHolder = `\${${variable.name}}`;
      
      text = text.replace(placeholder, value);
      text = text.replace(simpleHolder, value);
    });

    // Find final cursor position (${0})
    const cursorMatch = text.match(/\$\{0\}/);
    let cursorPosition;
    
    if (cursorMatch) {
      const lines = text.substring(0, cursorMatch.index).split('\n');
      cursorPosition = {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      };
      text = text.replace('${0}', '');
    }

    return {
      text,
      cursorPosition,
      selections,
    };
  }

  /**
   * Check if abbreviation matches template
   */
  public matchesAbbreviation(text: string, context: string): LiveTemplate | null {
    const templates = this.getTemplatesForContext(context);
    
    for (const template of templates) {
      if (text.endsWith(template.abbreviation)) {
        return template;
      }
    }

    return null;
  }

  /**
   * Enable/disable template
   */
  public setTemplateEnabled(abbreviation: string, enabled: boolean): void {
    const template = this.templates.get(abbreviation);
    if (template) {
      template.enabled = enabled;
    }
  }

  /**
   * Delete template
   */
  public deleteTemplate(abbreviation: string): boolean {
    return this.templates.delete(abbreviation);
  }

  /**
   * Update template
   */
  public updateTemplate(abbreviation: string, updates: Partial<LiveTemplate>): boolean {
    const template = this.templates.get(abbreviation);
    if (!template) return false;

    Object.assign(template, updates);
    return true;
  }

  /**
   * Export templates
   */
  public exportTemplates(): string {
    const templates = Array.from(this.templates.values());
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates
   */
  public importTemplates(jsonData: string): number {
    try {
      const templates = JSON.parse(jsonData) as LiveTemplate[];
      let imported = 0;

      templates.forEach(template => {
        this.registerTemplate(template);
        imported++;
      });

      return imported;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return 0;
    }
  }

  /**
   * Search templates
   */
  public searchTemplates(query: string): LiveTemplate[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.templates.values())
      .filter(t => 
        t.abbreviation.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.group.toLowerCase().includes(lowerQuery)
      );
  }

  /**
   * Get template statistics
   */
  public getStatistics(): {
    total: number;
    enabled: number;
    byGroup: Record<string, number>;
    byContext: Record<string, number>;
  } {
    const templates = Array.from(this.templates.values());
    const byGroup: Record<string, number> = {};
    const byContext: Record<string, number> = {};

    templates.forEach(t => {
      // Count by group
      byGroup[t.group] = (byGroup[t.group] || 0) + 1;

      // Count by context
      t.applicableContexts.forEach(ctx => {
        byContext[ctx] = (byContext[ctx] || 0) + 1;
      });
    });

    return {
      total: templates.length,
      enabled: templates.filter(t => t.enabled).length,
      byGroup,
      byContext,
    };
  }
}

export default LiveTemplatesSystem;
