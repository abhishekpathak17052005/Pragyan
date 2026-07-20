/**
 * Global Event Bus
 * Used by all modules to publish and subscribe to events
 *
 * In production, consider replacing with:
 * - RabbitMQ
 * - Redis Pub/Sub
 * - AWS SNS/SQS
 * - Apache Kafka
 */

type EventHandler = (payload: any) => Promise<void>;
type EventListeners = Map<string, EventHandler[]>;

class EventBusService {
  private listeners: EventListeners = new Map();

  /**
   * Subscribe to an event
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publish an event
   */
  async publish(eventType: string, payload: any): Promise<void> {
    const handlers = this.listeners.get(eventType) || [];

    // Execute all handlers in parallel
    // Failures in one handler don't stop others
    await Promise.all(
      handlers.map((handler) =>
        handler(payload).catch((error) => {
          console.error(`[EventBus] Error in handler for ${eventType}:`, error);
        })
      )
    );
  }

  /**
   * Clear all listeners for an event
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

export const EventBus = new EventBusService();
