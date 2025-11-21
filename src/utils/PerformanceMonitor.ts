/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  averages: Record<string, number>;
  slowest: PerformanceMetric[];
  totalTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    
    if (!startTime) {
      console.warn(`No start time found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  /**
   * Record a metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const averages: Record<string, number> = {};
    const metricNames = new Set(this.metrics.map((m) => m.name));

    for (const name of metricNames) {
      averages[name] = this.getAverage(name);
    }

    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      metrics: this.getMetrics(),
      averages,
      slowest,
      totalTime,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const report = this.getReport();

    console.group("Performance Summary");
    console.log(`Total operations: ${report.metrics.length}`);
    console.log(`Total time: ${report.totalTime.toFixed(2)}ms`);
    
    console.group("Averages");
    for (const [name, avg] of Object.entries(report.averages)) {
      console.log(`${name}: ${avg.toFixed(2)}ms`);
    }
    console.groupEnd();

    console.group("Slowest Operations");
    for (const metric of report.slowest.slice(0, 5)) {
      console.log(`${metric.name}: ${metric.duration.toFixed(2)}ms`);
    }
    console.groupEnd();

    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.start(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        performanceMonitor.end(metricName);
      }
    };

    return descriptor;
  };
}

/**
 * Higher-order function for measuring async functions
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  const metricName = name || fn.name || "anonymous";

  return (async (...args: any[]) => {
    performanceMonitor.start(metricName);
    try {
      return await fn(...args);
    } finally {
      performanceMonitor.end(metricName);
    }
  }) as T;
}

/**
 * Debounce function with performance tracking
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  name?: string
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  const metricName = name || fn.name || "debounced";

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      performanceMonitor.start(metricName);
      fn(...args);
      performanceMonitor.end(metricName);
    }, delay);
  };
}

/**
 * Throttle function with performance tracking
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  name?: string
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  const metricName = name || fn.name || "throttled";

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      performanceMonitor.start(metricName);
      fn(...args);
      performanceMonitor.end(metricName);
    }
  };
}

/**
 * Memory usage tracker
 */
export class MemoryMonitor {
  private samples: number[] = [];
  private maxSamples = 100;

  /**
   * Record current memory usage
   */
  sample(): void {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      this.samples.push(usedMB);

      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
    }
  }

  /**
   * Get average memory usage
   */
  getAverage(): number {
    if (this.samples.length === 0) return 0;
    const total = this.samples.reduce((sum, val) => sum + val, 0);
    return total / this.samples.length;
  }

  /**
   * Get peak memory usage
   */
  getPeak(): number {
    return Math.max(...this.samples);
  }

  /**
   * Get current memory usage
   */
  getCurrent(): number {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Clear samples
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * Log memory summary
   */
  logSummary(): void {
    console.group("Memory Summary");
    console.log(`Current: ${this.getCurrent().toFixed(2)} MB`);
    console.log(`Average: ${this.getAverage().toFixed(2)} MB`);
    console.log(`Peak: ${this.getPeak().toFixed(2)} MB`);
    console.groupEnd();
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

/**
 * Start automatic performance monitoring
 */
export function startPerformanceMonitoring(interval: number = 5000): () => void {
  const intervalId = setInterval(() => {
    memoryMonitor.sample();
  }, interval);

  // Log summary every minute
  const summaryInterval = setInterval(() => {
    performanceMonitor.logSummary();
    memoryMonitor.logSummary();
  }, 60000);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    clearInterval(summaryInterval);
  };
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring(
  operationName: string,
  dependencies: any[] = []
) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric({
      name: operationName,
      duration,
      timestamp: Date.now(),
    });
  };
}

/**
 * Optimize large list rendering with virtual scrolling
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Batch updates for better performance
 */
export function batchUpdates<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => void | Promise<void>
): Promise<void> {
  return new Promise(async (resolve) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);
      
      // Allow UI to update between batches
      await new Promise((r) => setTimeout(r, 0));
    }
    resolve();
  });
}
