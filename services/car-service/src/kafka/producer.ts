import { Kafka, Producer, Partitioners } from 'kafkajs';
import logger from '../utils/logger';

let producer: Producer | null = null;
let connectionAttempted = false;

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'car-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 3,
  },
});

export const getProducer = async (): Promise<Producer | null> => {
  if (producer) {
    return producer;
  }

  if (connectionAttempted) {
    return null;
  }

  connectionAttempted = true;

  try {
    producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });

    await Promise.race([
      producer.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      ),
    ]);

    logger.info('Kafka producer connected');
    return producer;
  } catch (error) {
    logger.warn('Failed to connect to Kafka, continuing without events', { error });
    connectionAttempted = false;
    return null;
  }
};

export const sendEvent = async (
  topic: string,
  message: object
): Promise<void> => {
  try {
    const kafkaProducer = await getProducer();
    if (!kafkaProducer) {
      return; // Silently skip if Kafka is unavailable
    }

    await kafkaProducer.send({
      topic,
      messages: [
        {
          key: (message as any).carId || (message as any).id || 'unknown',
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            service: 'car-service',
          }),
        },
      ],
    });
  } catch (error) {
    logger.error('Failed to send Kafka event', { topic, error });
  }
};

