/**
 * HTTP/REST Client
 * IntelliJ-style HTTP client for API testing:
 * - Request builder with all HTTP methods
 * - Headers and body management
 * - Response viewer with formatting
 * - Request collections
 * - Environment variables
 * - Authentication support
 * - Request history
 */

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'apiKey',
  OAUTH2 = 'oauth2',
}

export enum BodyType {
  NONE = 'none',
  JSON = 'json',
  XML = 'xml',
  FORM_DATA = 'form-data',
  URL_ENCODED = 'urlencoded',
  RAW = 'raw',
  BINARY = 'binary',
}

export interface HttpRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  auth?: AuthConfig;
  body?: RequestBody;
  timeout?: number;
  followRedirects?: boolean;
}

export interface AuthConfig {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  oauth2Config?: OAuth2Config;
}

export interface OAuth2Config {
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export interface RequestBody {
  type: BodyType;
  content: string;
  formData?: FormDataEntry[];
  file?: File;
}

export interface FormDataEntry {
  key: string;
  value: string;
  type: 'text' | 'file';
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time: number;
  redirected?: boolean;
}

export interface RequestCollection {
  id: string;
  name: string;
  description?: string;
  requests: HttpRequest[];
  environment?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
}

export interface RequestHistory {
  id: string;
  request: HttpRequest;
  response: HttpResponse;
  timestamp: Date;
}

export class HttpRestClient {
  private collections: Map<string, RequestCollection> = new Map();
  private environments: Map<string, Environment> = new Map();
  private activeEnvironment: string | null = null;
  private history: RequestHistory[] = [];
  private maxHistorySize: number = 100;

  /**
   * Send HTTP request
   */
  public async sendRequest(request: HttpRequest): Promise<HttpResponse> {
    const startTime = Date.now();
    
    try {
      // Replace environment variables in URL
      const url = this.replaceVariables(request.url);
      
      // Build request options
      const options: RequestInit = {
        method: request.method,
        headers: this.buildHeaders(request),
        body: this.buildBody(request),
        redirect: request.followRedirects ? 'follow' : 'manual',
        signal: request.timeout ? AbortSignal.timeout(request.timeout) : undefined,
      };

      // Send request
      const response = await fetch(url, options);
      
      // Build response object
      const responseBody = await this.extractBody(response);
      const endTime = Date.now();

      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response),
        body: responseBody,
        size: new Blob([responseBody]).size,
        time: endTime - startTime,
        redirected: response.redirected,
      };

      // Save to history
      this.addToHistory(request, httpResponse);

      return httpResponse;
    } catch (error: any) {
      const endTime = Date.now();
      
      return {
        status: 0,
        statusText: error.message || 'Request failed',
        headers: {},
        body: error.message || 'Request failed',
        size: 0,
        time: endTime - startTime,
      };
    }
  }

  /**
   * Build request headers
   */
  private buildHeaders(request: HttpRequest): Headers {
    const headers = new Headers();

    // Add custom headers
    Object.entries(request.headers).forEach(([key, value]) => {
      headers.set(key, this.replaceVariables(value));
    });

    // Add authentication headers
    if (request.auth) {
      this.addAuthHeaders(headers, request.auth);
    }

    // Add content type for body
    if (request.body && request.body.type !== BodyType.NONE) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', this.getContentType(request.body.type));
      }
    }

    return headers;
  }

  /**
   * Add authentication headers
   */
  private addAuthHeaders(headers: Headers, auth: AuthConfig): void {
    switch (auth.type) {
      case AuthType.BASIC:
        if (auth.username && auth.password) {
          const credentials = btoa(`${auth.username}:${auth.password}`);
          headers.set('Authorization', `Basic ${credentials}`);
        }
        break;

      case AuthType.BEARER:
        if (auth.token) {
          headers.set('Authorization', `Bearer ${auth.token}`);
        }
        break;

      case AuthType.API_KEY:
        if (auth.apiKey && auth.apiKeyHeader) {
          headers.set(auth.apiKeyHeader, auth.apiKey);
        }
        break;
    }
  }

  /**
   * Build request body
   */
  private buildBody(request: HttpRequest): BodyInit | null {
    if (!request.body || request.body.type === BodyType.NONE) {
      return null;
    }

    switch (request.body.type) {
      case BodyType.JSON:
      case BodyType.XML:
      case BodyType.RAW:
        return this.replaceVariables(request.body.content);

      case BodyType.FORM_DATA:
        const formData = new FormData();
        request.body.formData?.forEach(entry => {
          formData.append(entry.key, entry.value);
        });
        return formData;

      case BodyType.URL_ENCODED:
        const params = new URLSearchParams();
        request.body.formData?.forEach(entry => {
          params.append(entry.key, entry.value);
        });
        return params;

      case BodyType.BINARY:
        return request.body.file || null;

      default:
        return null;
    }
  }

  /**
   * Extract response headers
   */
  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Extract response body
   */
  private async extractBody(response: Response): Promise<string> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else {
      // For binary content, return base64
      const blob = await response.blob();
      return await this.blobToBase64(blob);
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get content type for body type
   */
  private getContentType(bodyType: BodyType): string {
    switch (bodyType) {
      case BodyType.JSON:
        return 'application/json';
      case BodyType.XML:
        return 'application/xml';
      case BodyType.FORM_DATA:
        return 'multipart/form-data';
      case BodyType.URL_ENCODED:
        return 'application/x-www-form-urlencoded';
      default:
        return 'text/plain';
    }
  }

  /**
   * Replace environment variables in string
   */
  private replaceVariables(text: string): string {
    if (!this.activeEnvironment) return text;

    const env = this.environments.get(this.activeEnvironment);
    if (!env) return text;

    let result = text;
    Object.entries(env.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return result;
  }

  /**
   * Collection Management
   */

  public createCollection(name: string, description?: string): string {
    const id = this.generateId();
    const collection: RequestCollection = {
      id,
      name,
      description,
      requests: [],
    };

    this.collections.set(id, collection);
    this.saveCollections();

    return id;
  }

  public getCollection(id: string): RequestCollection | null {
    return this.collections.get(id) || null;
  }

  public getAllCollections(): RequestCollection[] {
    return Array.from(this.collections.values());
  }

  public addRequestToCollection(collectionId: string, request: HttpRequest): void {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    collection.requests.push(request);
    this.saveCollections();
  }

  public removeRequestFromCollection(collectionId: string, requestId: string): void {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    collection.requests = collection.requests.filter(r => r.id !== requestId);
    this.saveCollections();
  }

  public deleteCollection(id: string): void {
    this.collections.delete(id);
    this.saveCollections();
  }

  /**
   * Environment Management
   */

  public createEnvironment(name: string, variables: Record<string, string>): string {
    const id = this.generateId();
    const environment: Environment = {
      id,
      name,
      variables,
      isActive: false,
    };

    this.environments.set(id, environment);
    this.saveEnvironments();

    return id;
  }

  public getEnvironment(id: string): Environment | null {
    return this.environments.get(id) || null;
  }

  public getAllEnvironments(): Environment[] {
    return Array.from(this.environments.values());
  }

  public setActiveEnvironment(id: string): void {
    // Deactivate all environments
    this.environments.forEach(env => {
      env.isActive = false;
    });

    // Activate selected environment
    const env = this.environments.get(id);
    if (env) {
      env.isActive = true;
      this.activeEnvironment = id;
      this.saveEnvironments();
    }
  }

  public updateEnvironment(id: string, variables: Record<string, string>): void {
    const env = this.environments.get(id);
    if (env) {
      env.variables = variables;
      this.saveEnvironments();
    }
  }

  public deleteEnvironment(id: string): void {
    if (this.activeEnvironment === id) {
      this.activeEnvironment = null;
    }
    this.environments.delete(id);
    this.saveEnvironments();
  }

  /**
   * History Management
   */

  private addToHistory(request: HttpRequest, response: HttpResponse): void {
    const entry: RequestHistory = {
      id: this.generateId(),
      request: { ...request },
      response: { ...response },
      timestamp: new Date(),
    };

    this.history.unshift(entry);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    this.saveHistory();
  }

  public getHistory(): RequestHistory[] {
    return this.history;
  }

  public getHistoryEntry(id: string): RequestHistory | null {
    return this.history.find(entry => entry.id === id) || null;
  }

  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Request Templates
   */

  public createRequestTemplate(method: HttpMethod, name: string): HttpRequest {
    return {
      id: this.generateId(),
      name,
      method,
      url: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json',
      },
      queryParams: {},
      timeout: 30000,
      followRedirects: true,
    };
  }

  /**
   * Export/Import
   */

  public exportCollection(collectionId: string): string {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    return JSON.stringify(collection, null, 2);
  }

  public importCollection(jsonData: string): string {
    const collection = JSON.parse(jsonData) as RequestCollection;
    collection.id = this.generateId(); // Generate new ID

    this.collections.set(collection.id, collection);
    this.saveCollections();

    return collection.id;
  }

  /**
   * Persistence
   */

  private saveCollections(): void {
    const data = Array.from(this.collections.values());
    localStorage.setItem('http_collections', JSON.stringify(data));
  }

  private loadCollections(): void {
    const data = localStorage.getItem('http_collections');
    if (data) {
      const collections = JSON.parse(data) as RequestCollection[];
      this.collections.clear();
      collections.forEach(collection => {
        this.collections.set(collection.id, collection);
      });
    }
  }

  private saveEnvironments(): void {
    const data = Array.from(this.environments.values());
    localStorage.setItem('http_environments', JSON.stringify(data));
  }

  private loadEnvironments(): void {
    const data = localStorage.getItem('http_environments');
    if (data) {
      const environments = JSON.parse(data) as Environment[];
      this.environments.clear();
      environments.forEach(env => {
        this.environments.set(env.id, env);
        if (env.isActive) {
          this.activeEnvironment = env.id;
        }
      });
    }
  }

  private saveHistory(): void {
    localStorage.setItem('http_history', JSON.stringify(this.history));
  }

  private loadHistory(): void {
    const data = localStorage.getItem('http_history');
    if (data) {
      this.history = JSON.parse(data).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    }
  }

  /**
   * Initialize client
   */
  public initialize(): void {
    this.loadCollections();
    this.loadEnvironments();
    this.loadHistory();
  }

  /**
   * Utility
   */

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cURL command
   */
  public generateCurlCommand(request: HttpRequest): string {
    const url = this.replaceVariables(request.url);
    let curl = `curl -X ${request.method} "${url}"`;

    // Add headers
    const headers = this.buildHeaders(request);
    headers.forEach((value, key) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });

    // Add body
    if (request.body && request.body.type !== BodyType.NONE) {
      const body = this.buildBody(request);
      if (typeof body === 'string') {
        curl += ` \\\n  -d '${body}'`;
      }
    }

    return curl;
  }
}

export default HttpRestClient;
