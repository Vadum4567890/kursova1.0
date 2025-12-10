import { Kafka, Producer, Partitioners } from 'kafkajs';
import { logger } from '../utils/logger';

export class KafkaProducer {
  private producer: Producer;
  private connected: boolean = false;
  private connectionAttempted: boolean = false;

  constructor() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    // Use LegacyPartitioner to suppress warning (or remove this to use new default)
    this.producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Set a timeout for connection attempt
      const connectPromise = this.producer.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      this.connected = true;
      logger.info('Kafka producer connected');
    } catch (error: any) {
      // Silently fail - Kafka is optional
      this.connected = false;
      // Only log once to avoid spam
      if (!this.connectionAttempted) {
        logger.debug('Kafka not available (optional). Events will be skipped.');
        this.connectionAttempted = true;
      }
    }
  }

  async send(topic: string, message: any): Promise<void> {
    // Silently skip if Kafka is not available
    if (!this.connected && this.connectionAttempted) {
      return; // Already tried to connect, skip silently
    }

    try {
      if (!this.connected) {
        await this.connect();
      }

      // Only send if connected
      if (!this.connected) {
        return; // Skip silently
      }

      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      // Silently fail - don't log errors for optional service
      this.connected = false;
      this.connectionAttempted = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      logger.info('Kafka producer disconnected');
    }
  }
}

