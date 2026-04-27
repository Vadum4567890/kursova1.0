import { Kafka, Producer, Partitioners } from 'kafkajs';
import logger from '../utils/logger';

let producer: Producer | null = null;
let connectionAttempted = false;

function parseBrokers(): string[] {
  const raw = process.env.KAFKA_BROKERS;
  // Empty string (e.g. in docker-compose) disables Kafka; unset still defaults to localhost:9092.
  if (raw !== undefined && raw.trim() === '') {
    return [];
  }
  const str =
    raw !== undefined && raw.trim() !== '' ? raw.trim() : 'localhost:9092';
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const brokers = parseBrokers();
const kafka =
  brokers.length > 0
    ? new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'car-service',
        brokers,
        retry: {
          initialRetryTime: 100,
          retries: 3,
        },
      })
    : null;

export const getProducer = async (): Promise<Producer | null> => {
  if (!kafka || brokers.length === 0) {
    return null;
  }

  if (producer) {
    return producer;
  }

  if (connectionAttempted) {
    return null;
  }

  connectionAttempted = true;

  const candidate = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  try {
    await Promise.race([
      candidate.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      ),
    ]);

    producer = candidate;
    logger.info('Kafka producer connected');
    return producer;
  } catch (error) {
    logger.warn('Failed to connect to Kafka, continuing without events', { error });
    producer = null;
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

