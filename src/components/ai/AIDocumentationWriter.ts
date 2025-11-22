export type DocumentationType = 'api' | 'readme' | 'user_guide' | 'architecture' | 'contributing';

export interface DocumentationSection {
  title: string;
  content: string;
  level: number;
  subsections: DocumentationSection[];
  codeExamples: string[];
  diagrams: string[];
}

export interface APIEndpointDoc {
  method: string;
  path: string;
  description: string;
  parameters: Record<string, any>;
  responses: Record<number, any>;
}

export interface DocumentationGenerationOptions {
  includeExamples?: boolean;
  includeAPI?: boolean;
  includeArchitecture?: boolean;
  style?: 'formal' | 'casual';
}

export class AIDocumentationWriter {
  private sections: Map<string, DocumentationSection> = new Map();
  private cache: Map<string, string> = new Map();

  async generateDocumentation(
    type: DocumentationType,
    sourceCode: string,
    _options?: DocumentationGenerationOptions
  ): Promise<string> {
    const cacheKey = `doc_${type}_${sourceCode.length}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const documentation = await this.createDocumentation(type, sourceCode);
    this.cache.set(cacheKey, documentation);
    return documentation;
  }

  private async createDocumentation(type: DocumentationType, _sourceCode: string): Promise<string> {
    const sections = this.generateSectionsByType(type);
    return this.formatDocumentation(sections, type);
  }

  private generateSectionsByType(type: DocumentationType): DocumentationSection[] {
    switch (type) {
      case 'api':
        return this.generateAPISections({}, {});
      case 'readme':
        return this.generateREADMESections({}, {});
      case 'user_guide':
        return this.generateUserGuideSections({}, {});
      case 'architecture':
        return this.generateArchitectureSections({}, {});
      default:
        return this.generateDefaultSections({}, {});
    }
  }

  private generateAPISections(_analysis: any, _options: any): DocumentationSection[] {
    return [
      {
        title: 'API Endpoints',
        content: 'Complete list of API endpoints with examples',
        level: 1,
        subsections: [
          {
            title: 'Authentication',
            content: 'Authentication methods and requirements',
            level: 2,
            subsections: [],
            codeExamples: ['Authorization: Bearer <token>'],
            diagrams: [],
          },
          {
            title: 'Error Handling',
            content: 'Standard error response format',
            level: 2,
            subsections: [],
            codeExamples: ['{ "error": "message", "code": 400 }'],
            diagrams: [],
          },
        ],
        codeExamples: [
          'GET /api/users\nPOST /api/users\nPUT /api/users/:id\nDELETE /api/users/:id',
        ],
        diagrams: [],
      },
    ];
  }

  private generateREADMESections(_analysis: any, _options: any): DocumentationSection[] {
    return [
      {
        title: 'Project Overview',
        content: 'Brief description of the project',
        level: 1,
        subsections: [
          {
            title: 'Features',
            content: 'Main features of the project',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: [],
          },
          {
            title: 'Installation',
            content: 'How to install the project',
            level: 2,
            subsections: [],
            codeExamples: ['npm install', 'npm start'],
            diagrams: [],
          },
        ],
        codeExamples: [],
        diagrams: [],
      },
    ];
  }

  private generateUserGuideSections(_analysis: any, _options: any): DocumentationSection[] {
    return [
      {
        title: 'User Guide',
        content: 'Complete guide for end users',
        level: 1,
        subsections: [
          {
            title: 'Getting Started',
            content: 'How to get started with the application',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: [],
          },
          {
            title: 'Common Tasks',
            content: 'Common tasks and how to perform them',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: [],
          },
        ],
        codeExamples: [],
        diagrams: [],
      },
    ];
  }

  private generateArchitectureSections(_analysis: any, _options: any): DocumentationSection[] {
    return [
      {
        title: 'Architecture Overview',
        content: 'System architecture and design patterns',
        level: 1,
        subsections: [
          {
            title: 'Components',
            content: 'System components and their interactions',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: ['Component diagram'],
          },
          {
            title: 'Data Flow',
            content: 'Data flow through the system',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: ['Data flow diagram'],
          },
        ],
        codeExamples: [],
        diagrams: [],
      },
    ];
  }

  private generateDefaultSections(_analysis: any, _options: any): DocumentationSection[] {
    return [
      {
        title: 'Documentation',
        content: 'Project documentation',
        level: 1,
        subsections: [
          {
            title: 'Introduction',
            content: 'Introduction to the project',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: [],
          },
          {
            title: 'Usage',
            content: 'How to use the project',
            level: 2,
            subsections: [],
            codeExamples: [],
            diagrams: [],
          },
        ],
        codeExamples: [],
        diagrams: [],
      },
    ];
  }

  private formatDocumentation(sections: DocumentationSection[], _type: DocumentationType): string {
    let markdown = '';
    sections.forEach((section) => {
      markdown += this.formatSection(section);
    });
    return markdown;
  }

  private formatSection(section: DocumentationSection): string {
    const heading = '#'.repeat(section.level);
    let formatted = `\n${heading} ${section.title}\n\n${section.content}\n\n`;

    section.codeExamples.forEach((example) => {
      formatted += `\`\`\`\n${example}\n\`\`\`\n\n`;
    });

    section.subsections.forEach((subsection) => {
      formatted += this.formatSection(subsection);
    });

    return formatted;
  }

  private generateTitle(type: DocumentationType, _analysis: any): string {
    switch (type) {
      case 'api':
        return 'API Documentation';
      case 'readme':
        return 'README';
      case 'user_guide':
        return 'User Guide';
      case 'architecture':
        return 'Architecture Documentation';
      case 'contributing':
        return 'Contributing Guide';
      default:
        return 'Documentation';
    }
  }

  private generateDescription(type: DocumentationType, _analysis: any): string {
    switch (type) {
      case 'api':
        return 'Complete API reference with all endpoints and examples';
      case 'readme':
        return 'Project overview and setup instructions';
      case 'user_guide':
        return 'User-friendly guide and tutorials';
      case 'architecture':
        return 'System architecture and design patterns';
      case 'contributing':
        return 'Guidelines for contributing to the project';
      default:
        return 'Project documentation';
    }
  }

  private generateAuthenticationSection(_endpoints: APIEndpointDoc[]): DocumentationSection {
    return {
      title: 'Authentication',
      content: 'All API endpoints require authentication using Bearer tokens',
      level: 2,
      subsections: [],
      codeExamples: [
        'Authorization: Bearer <your-jwt-token>',
        'curl -H "Authorization: Bearer token" https://api.example.com/endpoint',
      ],
      diagrams: [],
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const aiDocumentationWriter = new AIDocumentationWriter();