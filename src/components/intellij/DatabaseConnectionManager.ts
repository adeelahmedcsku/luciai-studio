import { invoke } from '@tauri-apps/api/core';

/**
 * Database Connection Manager
 * Provides IntelliJ-style database tools:
 * - Multiple database support (PostgreSQL, MySQL, SQLite, MongoDB)
 * - Connection management
 * - Schema viewer
 * - Query execution
 * - Data export/import
 * - Table editor
 */

export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MONGODB = 'mongodb',
  MSSQL = 'mssql',
  ORACLE = 'oracle',
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filePath?: string; // For SQLite
  options?: Record<string, any>;
  connected: boolean;
  lastConnected?: Date;
}

export interface DatabaseSchema {
  tables: TableInfo[];
  views: ViewInfo[];
  procedures: ProcedureInfo[];
  functions: FunctionInfo[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  comment?: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface ForeignKeyInfo {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface ViewInfo {
  name: string;
  schema: string;
  definition: string;
}

export interface ProcedureInfo {
  name: string;
  schema: string;
  parameters: ParameterInfo[];
  definition: string;
}

export interface FunctionInfo {
  name: string;
  schema: string;
  parameters: ParameterInfo[];
  returnType: string;
  definition: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  affectedRows?: number;
}

export class DatabaseConnectionManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private activeConnection: string | null = null;
  private schemaCache: Map<string, DatabaseSchema> = new Map();

  /**
   * Add a new database connection
   */
  public async addConnection(connection: Omit<DatabaseConnection, 'id' | 'connected'>): Promise<string> {
    const id = this.generateConnectionId();
    const fullConnection: DatabaseConnection = {
      ...connection,
      id,
      connected: false,
    };

    this.connections.set(id, fullConnection);
    await this.saveConnections();

    return id;
  }

  /**
   * Connect to a database
   */
  public async connect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    try {
      // Call backend to establish connection
      const result = await invoke<boolean>('db_connect', {
        connectionId,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        filePath: connection.filePath,
        options: connection.options,
      });

      if (result) {
        connection.connected = true;
        connection.lastConnected = new Date();
        this.activeConnection = connectionId;
        
        // Load schema
        await this.loadSchema(connectionId);
      }

      return result;
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  }

  /**
   * Disconnect from a database
   */
  public async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      return;
    }

    try {
      await invoke('db_disconnect', { connectionId });
      connection.connected = false;
      
      if (this.activeConnection === connectionId) {
        this.activeConnection = null;
      }

      this.schemaCache.delete(connectionId);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * Test connection without saving
   */
  public async testConnection(connection: Omit<DatabaseConnection, 'id' | 'connected'>): Promise<boolean> {
    try {
      const result = await invoke<boolean>('db_test_connection', {
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        filePath: connection.filePath,
        options: connection.options,
      });

      return result;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Load database schema
   */
  public async loadSchema(connectionId: string): Promise<DatabaseSchema> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Not connected to database');
    }

    try {
      const schema = await invoke<DatabaseSchema>('db_load_schema', { connectionId });
      this.schemaCache.set(connectionId, schema);
      return schema;
    } catch (error) {
      console.error('Failed to load schema:', error);
      throw error;
    }
  }

  /**
   * Get cached schema
   */
  public getSchema(connectionId: string): DatabaseSchema | null {
    return this.schemaCache.get(connectionId) || null;
  }

  /**
   * Execute SQL query
   */
  public async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Not connected to database');
    }

    try {
      const startTime = Date.now();
      const result = await invoke<QueryResult>('db_execute_query', {
        connectionId,
        query,
      });
      
      result.executionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple queries in transaction
   */
  public async executeTransaction(connectionId: string, queries: string[]): Promise<QueryResult[]> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected) {
      throw new Error('Not connected to database');
    }

    try {
      const results = await invoke<QueryResult[]>('db_execute_transaction', {
        connectionId,
        queries,
      });

      return results;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get table data with pagination
   */
  public async getTableData(
    connectionId: string,
    tableName: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<QueryResult> {
    const offset = (page - 1) * pageSize;
    const query = `SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`;
    return await this.executeQuery(connectionId, query);
  }

  /**
   * Get table row count
   */
  public async getTableRowCount(connectionId: string, tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.executeQuery(connectionId, query);
    return result.rows[0][0];
  }

  /**
   * Export table data to CSV
   */
  public async exportToCSV(connectionId: string, tableName: string, filePath: string): Promise<void> {
    try {
      await invoke('db_export_csv', {
        connectionId,
        tableName,
        filePath,
      });
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Import data from CSV
   */
  public async importFromCSV(connectionId: string, tableName: string, filePath: string): Promise<number> {
    try {
      const rowsImported = await invoke<number>('db_import_csv', {
        connectionId,
        tableName,
        filePath,
      });

      return rowsImported;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  /**
   * Create table
   */
  public async createTable(
    connectionId: string,
    tableName: string,
    columns: ColumnInfo[]
  ): Promise<void> {
    const columnDefs = columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.isPrimaryKey) def += ' PRIMARY KEY';
      if (col.isAutoIncrement) def += ' AUTO_INCREMENT';
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(', ');

    const query = `CREATE TABLE ${tableName} (${columnDefs})`;
    await this.executeQuery(connectionId, query);
    
    // Refresh schema
    await this.loadSchema(connectionId);
  }

  /**
   * Drop table
   */
  public async dropTable(connectionId: string, tableName: string): Promise<void> {
    const query = `DROP TABLE ${tableName}`;
    await this.executeQuery(connectionId, query);
    
    // Refresh schema
    await this.loadSchema(connectionId);
  }

  /**
   * Rename table
   */
  public async renameTable(connectionId: string, oldName: string, newName: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');

    let query: string;
    switch (connection.type) {
      case DatabaseType.MYSQL:
        query = `RENAME TABLE ${oldName} TO ${newName}`;
        break;
      case DatabaseType.POSTGRESQL:
        query = `ALTER TABLE ${oldName} RENAME TO ${newName}`;
        break;
      case DatabaseType.SQLITE:
        query = `ALTER TABLE ${oldName} RENAME TO ${newName}`;
        break;
      default:
        throw new Error(`Rename not supported for ${connection.type}`);
    }

    await this.executeQuery(connectionId, query);
    await this.loadSchema(connectionId);
  }

  /**
   * Add column to table
   */
  public async addColumn(
    connectionId: string,
    tableName: string,
    column: ColumnInfo
  ): Promise<void> {
    let columnDef = `${column.name} ${column.type}`;
    if (!column.nullable) columnDef += ' NOT NULL';
    if (column.defaultValue) columnDef += ` DEFAULT ${column.defaultValue}`;

    const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`;
    await this.executeQuery(connectionId, query);
    await this.loadSchema(connectionId);
  }

  /**
   * Generate SQL for creating table
   */
  public generateCreateTableSQL(table: TableInfo, dbType: DatabaseType): string {
    const columns = table.columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      if (col.isPrimaryKey) def += ' PRIMARY KEY';
      if (col.isAutoIncrement && dbType === DatabaseType.MYSQL) def += ' AUTO_INCREMENT';
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(',\n');

    let sql = `CREATE TABLE ${table.name} (\n${columns}`;

    // Add foreign keys
    if (table.foreignKeys.length > 0) {
      const fks = table.foreignKeys.map(fk =>
        `  FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`
      ).join(',\n');
      sql += ',\n' + fks;
    }

    sql += '\n);';

    // Add indexes
    if (table.indexes.length > 0) {
      const indexes = table.indexes.map(idx => {
        const unique = idx.unique ? 'UNIQUE ' : '';
        return `CREATE ${unique}INDEX ${idx.name} ON ${table.name} (${idx.columns.join(', ')});`;
      }).join('\n');
      sql += '\n\n' + indexes;
    }

    return sql;
  }

  /**
   * Get all connections
   */
  public getAllConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection by ID
   */
  public getConnection(id: string): DatabaseConnection | null {
    return this.connections.get(id) || null;
  }

  /**
   * Get active connection
   */
  public getActiveConnection(): DatabaseConnection | null {
    return this.activeConnection ? this.connections.get(this.activeConnection) || null : null;
  }

  /**
   * Update connection
   */
  public async updateConnection(id: string, updates: Partial<DatabaseConnection>): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error('Connection not found');
    }

    Object.assign(connection, updates);
    await this.saveConnections();
  }

  /**
   * Delete connection
   */
  public async deleteConnection(id: string): Promise<void> {
    const connection = this.connections.get(id);
    if (connection?.connected) {
      await this.disconnect(id);
    }

    this.connections.delete(id);
    await this.saveConnections();
  }

  /**
   * Save connections to storage
   */
  private async saveConnections(): Promise<void> {
    const connectionData = Array.from(this.connections.values()).map(conn => ({
      ...conn,
      password: this.encryptPassword(conn.password || ''),
    }));

    try {
      await invoke('save_db_connections', { connections: connectionData });
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  }

  /**
   * Load connections from storage
   */
  public async loadConnections(): Promise<void> {
    try {
      const connectionData = await invoke<DatabaseConnection[]>('load_db_connections');
      
      this.connections.clear();
      connectionData.forEach(conn => {
        conn.password = this.decryptPassword(conn.password || '');
        conn.connected = false;
        this.connections.set(conn.id, conn);
      });
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Encrypt password (basic implementation)
   */
  private encryptPassword(password: string): string {
    // In production, use proper encryption
    return btoa(password);
  }

  /**
   * Decrypt password (basic implementation)
   */
  private decryptPassword(encrypted: string): string {
    // In production, use proper decryption
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  }

  /**
   * Build connection string
   */
  public buildConnectionString(connection: DatabaseConnection): string {
    switch (connection.type) {
      case DatabaseType.POSTGRESQL:
        return `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      
      case DatabaseType.MYSQL:
        return `mysql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      
      case DatabaseType.SQLITE:
        return `sqlite://${connection.filePath}`;
      
      case DatabaseType.MONGODB:
        return `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      
      default:
        return '';
    }
  }

  /**
   * Get default port for database type
   */
  public static getDefaultPort(type: DatabaseType): number {
    switch (type) {
      case DatabaseType.POSTGRESQL: return 5432;
      case DatabaseType.MYSQL: return 3306;
      case DatabaseType.MONGODB: return 27017;
      case DatabaseType.MSSQL: return 1433;
      case DatabaseType.ORACLE: return 1521;
      default: return 0;
    }
  }
}

export default DatabaseConnectionManager;
