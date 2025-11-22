export type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'latency';
export type ResourceType = 'server' | 'database' | 'load_balancer' | 'storage' | 'network' | 'container' | 'cache';

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface ResourceMetrics {
  resourceId: string;
  type: ResourceType;
  metrics: Metric[];
  health: 'healthy' | 'warning' | 'critical';
}

export class InfrastructureMonitoring {
  private metrics: Map<string, Metric[]> = new Map();

  getMetrics(resourceId: string, type: MetricType): Metric[] {
    const key = `${resourceId}_${type}`;
    return this.metrics.get(key) || [];
  }

  getAggregatedMetrics(
    resourceId: string,
    type: MetricType,
    _period: 'hour' | 'day' | 'week'
  ): {
    average: number;
    min: number;
    max: number;
    samples: number;
  } {
    const metrics = this.getMetrics(resourceId, type);

    if (metrics.length === 0) {
      return { average: 0, min: 0, max: 0, samples: 0 };
    }

    const values = metrics.map((m) => m.value);
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      samples: values.length,
    };
  }

  recordMetric(resourceId: string, type: MetricType, value: number): void {
    const key = `${resourceId}_${type}`;
    const metrics = this.metrics.get(key) || [];

    metrics.push({
      name: type,
      value,
      unit: this.getUnit(type),
      timestamp: Date.now(),
    });

    this.metrics.set(key, metrics);
  }

  private getUnit(type: MetricType): string {
    switch (type) {
      case 'cpu':
        return '%';
      case 'memory':
        return 'MB';
      case 'disk':
        return 'GB';
      case 'network':
        return 'Mbps';
      case 'latency':
        return 'ms';
      default:
        return '';
    }
  }

  getResourceHealth(resourceId: string): ResourceMetrics {
    const cpuMetrics = this.getAggregatedMetrics(resourceId, 'cpu', 'hour');
    const memoryMetrics = this.getAggregatedMetrics(resourceId, 'memory', 'hour');

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (cpuMetrics.average > 80 || memoryMetrics.average > 85) {
      health = 'warning';
    }
    if (cpuMetrics.average > 95 || memoryMetrics.average > 95) {
      health = 'critical';
    }

    return {
      resourceId,
      type: 'server',
      metrics: [
        {
          name: 'cpu_average',
          value: cpuMetrics.average,
          unit: '%',
          timestamp: Date.now(),
        },
        {
          name: 'memory_average',
          value: memoryMetrics.average,
          unit: 'MB',
          timestamp: Date.now(),
        },
      ],
      health,
    };
  }

  getResourcesByType(): Record<ResourceType, number> {
    const byType: Record<ResourceType, number> = {
      server: 0,
      database: 0,
      load_balancer: 0,
      storage: 0,
      network: 0,
      container: 0,
      cache: 0,
    };

    return byType;
  }
}

export const infrastructureMonitoring = new InfrastructureMonitoring();