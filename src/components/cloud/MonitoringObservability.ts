/**
 * Monitoring & Observability System
 * Feature 128 - Application performance monitoring and observability
 * 
 * Capabilities:
 * - Application performance monitoring (APM)
 * - Error tracking and reporting
 * - Log aggregation and analysis
 * - Metrics dashboard and visualization
 * - Alert configuration and management
 * - Distributed tracing
 * - Real-time monitoring
 * - Performance profiling
 * - User analytics
 * 
 * @module MonitoringObservability
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Monitoring providers
 */
export enum MonitoringProvider {
  DATADOG = 'datadog',
  NEW_RELIC = 'new_relic',
  SENTRY = 'sentry',
  GRAFANA = 'grafana',
  PROMETHEUS = 'prometheus',
  ELASTIC = 'elastic',
  CUSTOM = 'custom',
}

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Alert severity
 */
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  id: string;
  provider: MonitoringProvider;
  apiKey: string;
  projectId?: string;
  endpoint?: string;
  sampling: {
    traces: number; // 0-1
    errors: number; // 0-1
    logs: number; // 0-1
  };
  tags: Record<string, string>;
  enabled: boolean;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  metadata?: any;
}

/**
 * Application error
 */
export interface ApplicationError {
  id: string;
  message: string;
  type: string;
  stackTrace: string;
  timestamp: Date;
  level: LogLevel;
  context: {
    user?: string;
    request?: {
      method: string;
      url: string;
      headers: Record<string, string>;
    };
    environment: string;
    version: string;
  };
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
}

/**
 * Log entry
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  tags: Record<string, string>;
  fields: Record<string, any>;
}

/**
 * Trace span
 */
export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  service: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  tags: Record<string, string>;
  logs: Array<{
    timestamp: Date;
    fields: Record<string, any>;
  }>;
  error?: boolean;
}

/**
 * Distributed trace
 */
export interface DistributedTrace {
  traceId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  spans: TraceSpan[];
  services: string[];
  errors: number;
}

/**
 * Alert rule
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration: number; // seconds
  };
  severity: AlertSeverity;
  actions: Array<{
    type: 'email' | 'slack' | 'webhook' | 'pagerduty';
    config: any;
  }>;
  enabled: boolean;
  cooldown: number; // minutes
}

/**
 * Alert incident
 */
export interface AlertIncident {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'firing' | 'resolved' | 'acknowledged';
  context: any;
  notifications: Array<{
    type: string;
    sentAt: Date;
    status: string;
  }>;
}

/**
 * Dashboard widget
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stat' | 'table' | 'log' | 'alert';
  title: string;
  config: {
    metrics?: string[];
    timeRange?: string;
    refreshInterval?: number;
    visualization?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Monitoring dashboard
 */
export interface MonitoringDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  timeRange: {
    start: Date;
    end: Date;
  };
  refreshInterval: number;
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  period: {
    start: Date;
    end: Date;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errors: {
    total: number;
    rate: number;
    byType: Record<string, number>;
  };
  performance: {
    cpu: {
      avg: number;
      max: number;
    };
    memory: {
      avg: number;
      max: number;
    };
    throughput: number;
  };
}

/**
 * Monitoring & Observability class
 */
export class MonitoringObservability {
  private configurations: Map<string, MonitoringConfig> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeIncidents: Map<string, AlertIncident> = new Map();
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private metricsBuffer: PerformanceMetric[] = [];

  /**
   * Initialize monitoring
   */
  async initialize(config: MonitoringConfig): Promise<boolean> {
    try {
      await invoke('initialize_monitoring', {
        provider: config.provider,
        apiKey: config.apiKey,
        projectId: config.projectId,
      });

      this.configurations.set(config.id, config);
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize monitoring: ${error}`);
    }
  }

  /**
   * Track performance metric
   */
  async trackMetric(metric: PerformanceMetric): Promise<void> {
    try {
      this.metricsBuffer.push(metric);

      // Flush buffer if it's large
      if (this.metricsBuffer.length >= 100) {
        await this.flushMetrics();
      }

      // Also send immediately for real-time monitoring
      await invoke('track_metric', { metric });
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }

  /**
   * Track error
   */
  async trackError(error: ApplicationError): Promise<string> {
    try {
      const errorId = await invoke<string>('track_error', {
        error: {
          message: error.message,
          type: error.type,
          stackTrace: error.stackTrace,
          context: error.context,
        },
      });

      return errorId;
    } catch (err) {
      console.error('Failed to track error:', err);
      return '';
    }
  }

  /**
   * Log message
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      await invoke('log_message', {
        level: entry.level,
        message: entry.message,
        source: entry.source,
        tags: entry.tags,
        fields: entry.fields,
      });
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  /**
   * Start distributed trace
   */
  async startTrace(name: string, service: string): Promise<string> {
    try {
      return await invoke<string>('start_trace', { name, service });
    } catch (error) {
      throw new Error(`Failed to start trace: ${error}`);
    }
  }

  /**
   * Add span to trace
   */
  async addSpan(span: TraceSpan): Promise<void> {
    try {
      await invoke('add_trace_span', { span });
    } catch (error) {
      console.error('Failed to add span:', error);
    }
  }

  /**
   * End trace
   */
  async endTrace(traceId: string): Promise<void> {
    try {
      await invoke('end_trace', { traceId });
    } catch (error) {
      console.error('Failed to end trace:', error);
    }
  }

  /**
   * Query metrics
   */
  async queryMetrics(
    metricName: string,
    startTime: Date,
    endTime: Date,
    tags?: Record<string, string>
  ): Promise<PerformanceMetric[]> {
    try {
      return await invoke<PerformanceMetric[]>('query_metrics', {
        metricName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        tags,
      });
    } catch (error) {
      throw new Error(`Failed to query metrics: ${error}`);
    }
  }

  /**
   * Search logs
   */
  async searchLogs(
    query: string,
    startTime: Date,
    endTime: Date,
    level?: LogLevel
  ): Promise<LogEntry[]> {
    try {
      return await invoke<LogEntry[]>('search_logs', {
        query,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        level,
      });
    } catch (error) {
      throw new Error(`Failed to search logs: ${error}`);
    }
  }

  /**
   * Get trace details
   */
  async getTrace(traceId: string): Promise<DistributedTrace> {
    try {
      return await invoke<DistributedTrace>('get_trace', { traceId });
    } catch (error) {
      throw new Error(`Failed to get trace: ${error}`);
    }
  }

  /**
   * List errors
   */
  async listErrors(
    startTime: Date,
    endTime: Date,
    filters?: {
      level?: LogLevel;
      resolved?: boolean;
      type?: string;
    }
  ): Promise<ApplicationError[]> {
    try {
      return await invoke<ApplicationError[]>('list_errors', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        filters,
      });
    } catch (error) {
      throw new Error(`Failed to list errors: ${error}`);
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: AlertRule): Promise<string> {
    try {
      const ruleId = await invoke<string>('create_alert_rule', { rule });
      this.alertRules.set(ruleId, { ...rule, id: ruleId });
      return ruleId;
    } catch (error) {
      throw new Error(`Failed to create alert rule: ${error}`);
    }
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    try {
      await invoke('update_alert_rule', { ruleId, updates });
      
      const rule = this.alertRules.get(ruleId);
      if (rule) {
        this.alertRules.set(ruleId, { ...rule, ...updates });
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<boolean> {
    try {
      await invoke('delete_alert_rule', { ruleId });
      this.alertRules.delete(ruleId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all alert rules
   */
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): AlertIncident[] {
    return Array.from(this.activeIncidents.values())
      .filter(i => i.status === 'firing');
  }

  /**
   * Acknowledge incident
   */
  async acknowledgeIncident(incidentId: string): Promise<boolean> {
    try {
      await invoke('acknowledge_incident', { incidentId });
      
      const incident = this.activeIncidents.get(incidentId);
      if (incident) {
        incident.status = 'acknowledged';
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Resolve incident
   */
  async resolveIncident(incidentId: string): Promise<boolean> {
    try {
      await invoke('resolve_incident', { incidentId });
      
      const incident = this.activeIncidents.get(incidentId);
      if (incident) {
        incident.status = 'resolved';
        incident.resolvedAt = new Date();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create dashboard
   */
  createDashboard(dashboard: MonitoringDashboard): string {
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard.id;
  }

  /**
   * Update dashboard
   */
  updateDashboard(dashboardId: string, updates: Partial<MonitoringDashboard>): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    this.dashboards.set(dashboardId, { ...dashboard, ...updates });
    return true;
  }

  /**
   * Get dashboard
   */
  getDashboard(dashboardId: string): MonitoringDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * List all dashboards
   */
  getAllDashboards(): MonitoringDashboard[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceSummary> {
    try {
      return await invoke<PerformanceSummary>('get_performance_summary', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
    } catch (error) {
      throw new Error(`Failed to get performance summary: ${error}`);
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
    latency: number;
  }> {
    try {
      return await invoke<{
        cpu: number;
        memory: number;
        requests: number;
        errors: number;
        latency: number;
      }>('get_realtime_metrics');
    } catch (error) {
      throw new Error(`Failed to get real-time metrics: ${error}`);
    }
  }

  /**
   * Export metrics data
   */
  async exportMetrics(
    startTime: Date,
    endTime: Date,
    format: 'json' | 'csv' | 'prometheus'
  ): Promise<string> {
    try {
      return await invoke<string>('export_metrics', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        format,
      });
    } catch (error) {
      throw new Error(`Failed to export metrics: ${error}`);
    }
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformanceTrends(
    metricName: string,
    days: number = 7
  ): Promise<{
    trend: 'improving' | 'stable' | 'degrading';
    change: number;
    forecast: Array<{ date: Date; value: number }>;
    anomalies: Array<{ date: Date; value: number; reason: string }>;
  }> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

      const metrics = await this.queryMetrics(metricName, startTime, endTime);
      
      // Calculate trend
      const values = metrics.map(m => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const recentAvg = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
      
      let trend: 'improving' | 'stable' | 'degrading';
      if (recentAvg < avg * 0.9) trend = 'improving';
      else if (recentAvg > avg * 1.1) trend = 'degrading';
      else trend = 'stable';

      const change = ((recentAvg - avg) / avg) * 100;

      return {
        trend,
        change,
        forecast: [],
        anomalies: [],
      };
    } catch (error) {
      throw new Error(`Failed to analyze trends: ${error}`);
    }
  }

  /**
   * Get error insights
   */
  async getErrorInsights(days: number = 7): Promise<{
    topErrors: Array<{ type: string; count: number; trend: string }>;
    errorRate: number;
    affectedUsers: number;
    resolution: {
      avg: number;
      p50: number;
      p95: number;
    };
  }> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

      const errors = await this.listErrors(startTime, endTime);
      
      // Group by type
      const errorsByType: Record<string, number> = {};
      for (const error of errors) {
        errorsByType[error.type] = (errorsByType[error.type] || 0) + error.occurrences;
      }

      const topErrors = Object.entries(errorsByType)
        .map(([type, count]) => ({ type, count, trend: 'stable' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        topErrors,
        errorRate: errors.length / days,
        affectedUsers: 0,
        resolution: {
          avg: 0,
          p50: 0,
          p95: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get error insights: ${error}`);
    }
  }

  /**
   * Setup automated monitoring
   */
  async setupAutomatedMonitoring(appName: string): Promise<{
    config: MonitoringConfig;
    rules: AlertRule[];
    dashboard: MonitoringDashboard;
  }> {
    // Create default configuration
    const config: MonitoringConfig = {
      id: `mon_${Date.now()}`,
      provider: MonitoringProvider.PROMETHEUS,
      apiKey: '',
      sampling: {
        traces: 1.0,
        errors: 1.0,
        logs: 0.1,
      },
      tags: {
        app: appName,
        environment: 'production',
      },
      enabled: true,
    };

    // Create default alert rules
    const rules: AlertRule[] = [
      {
        id: `rule_${Date.now()}_1`,
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 5,
          duration: 300,
        },
        severity: AlertSeverity.CRITICAL,
        actions: [],
        enabled: true,
        cooldown: 15,
      },
      {
        id: `rule_${Date.now()}_2`,
        name: 'High Response Time',
        description: 'Alert when response time is too high',
        condition: {
          metric: 'response_time_p95',
          operator: '>',
          threshold: 1000,
          duration: 300,
        },
        severity: AlertSeverity.HIGH,
        actions: [],
        enabled: true,
        cooldown: 15,
      },
    ];

    // Create default dashboard
    const dashboard: MonitoringDashboard = {
      id: `dash_${Date.now()}`,
      name: `${appName} Overview`,
      widgets: [
        {
          id: 'widget_1',
          type: 'chart',
          title: 'Request Rate',
          config: {
            metrics: ['requests_per_second'],
            timeRange: '1h',
            refreshInterval: 30,
          },
          position: { x: 0, y: 0, width: 6, height: 4 },
        },
        {
          id: 'widget_2',
          type: 'chart',
          title: 'Error Rate',
          config: {
            metrics: ['error_rate'],
            timeRange: '1h',
            refreshInterval: 30,
          },
          position: { x: 6, y: 0, width: 6, height: 4 },
        },
      ],
      timeRange: {
        start: new Date(Date.now() - 3600000),
        end: new Date(),
      },
      refreshInterval: 30,
    };

    await this.initialize(config);
    for (const rule of rules) {
      await this.createAlertRule(rule);
    }
    this.createDashboard(dashboard);

    return { config, rules, dashboard };
  }

  /**
   * Flush metrics buffer
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      await invoke('flush_metrics', {
        metrics: this.metricsBuffer,
      });
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }
}

/**
 * Global monitoring & observability instance
 */
export const monitoringObservability = new MonitoringObservability();

export default MonitoringObservability;
