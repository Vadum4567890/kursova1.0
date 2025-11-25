/**
 * Simple Dependency Injection Container
 * Implements Singleton pattern for service registration and resolution
 */
export class Container {
  private static instance: Container;
  private services = new Map<string, () => any>();
  private singletons = new Map<string, any>();

  private constructor() {}

  /**
   * Get singleton instance of Container
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a service factory
   * @param key - Unique identifier for the service
   * @param factory - Factory function that creates the service
   * @param singleton - If true, service will be created once and reused
   */
  register<T>(key: string, factory: () => T, singleton: boolean = true): void {
    if (singleton) {
      // Store factory for lazy initialization
      this.services.set(key, () => {
        if (!this.singletons.has(key)) {
          this.singletons.set(key, factory());
        }
        return this.singletons.get(key);
      });
    } else {
      // Store factory for new instance each time
      this.services.set(key, factory);
    }
  }

  /**
   * Resolve a service by key
   * @param key - Service identifier
   * @returns Service instance
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service "${key}" not found in container. Make sure it's registered.`);
    }
    return factory() as T;
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

// Export singleton instance
export const container = Container.getInstance();

