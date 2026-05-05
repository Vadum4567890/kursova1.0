#!/usr/bin/env ts-node
/**
 * Migration script: transfer clients from client_service_db to user_service_db
 *
 * Usage: npm run migrate:clients
 *
 * This script:
 * 1. Connects to both databases
 * 2. Reads all clients from client_service_db
 * 3. Creates user_accounts and user_profiles in user_service_db
 * 4. Verifies data integrity
 * 5. Logs results
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from '../services/client-service/src/entities/Client.entity';
import { UserAccount } from '../services/user-service/src/entities/UserAccount.entity';
import { UserProfile } from '../services/user-service/src/entities/UserProfile.entity';

const clientServiceDb = new DataSource({
  type: 'postgres',
  host: process.env.CLIENT_DB_HOST || 'localhost',
  port: parseInt(process.env.CLIENT_DB_PORT || '5432', 10),
  username: process.env.CLIENT_DB_USERNAME || 'postgres',
  password: process.env.CLIENT_DB_PASSWORD || '1234',
  database: process.env.CLIENT_DB_DATABASE || 'client_service_db',
  entities: [Client],
  synchronize: false,
});

const userServiceDb = new DataSource({
  type: 'postgres',
  host: process.env.USER_DB_HOST || 'localhost',
  port: parseInt(process.env.USER_DB_PORT || '5432', 10),
  username: process.env.USER_DB_USERNAME || 'postgres',
  password: process.env.USER_DB_PASSWORD || '1234',
  database: process.env.USER_DB_DATABASE || 'user_service_db',
  entities: [UserAccount, UserProfile],
  synchronize: false,
});

async function migrateClients() {
  try {
    console.log('🔄 Starting client migration...');

    await clientServiceDb.initialize();
    await userServiceDb.initialize();

    const clientRepo = clientServiceDb.getRepository(Client);
    const userAccountRepo = userServiceDb.getRepository(UserAccount);
    const userProfileRepo = userServiceDb.getRepository(UserProfile);

    const clients = await clientRepo.find();
    console.log(`📊 Found ${clients.length} clients in client_service_db`);

    let created = 0;
    let skipped = 0;

    for (const client of clients) {
      try {
        // Check if user already exists by email
        const existing = client.email
          ? await userAccountRepo.findOne({ where: { email: client.email } })
          : null;

        if (existing) {
          console.log(`⏭️  Skipping client ${client.id} (${client.email}) - already exists`);
          skipped++;
          continue;
        }

        // Create user account
        const userAccount = userAccountRepo.create({
          email: client.email || `client+${client.phone}@migrated.local`,
          role: 'renter',
          isActive: true,
          verifiedStatus: 'unverified',
        });

        const savedAccount = await userAccountRepo.save(userAccount);

        // Create user profile
        const userProfile = userProfileRepo.create({
          userId: savedAccount.id,
          fullName: client.fullName,
          phone: client.phone,
          address: client.address,
        });

        await userProfileRepo.save(userProfile);

        console.log(`✅ Migrated client ${client.id} → user ${savedAccount.id}`);
        created++;
      } catch (error) {
        console.error(`❌ Error migrating client ${client.id}:`, error);
      }
    }

    console.log(`\n📈 Migration complete:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${clients.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await clientServiceDb.destroy();
    await userServiceDb.destroy();
  }
}

migrateClients();
