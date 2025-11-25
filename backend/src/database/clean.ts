import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Car } from '../models/Car.entity';
import { Client } from '../models/Client.entity';
import { Rental } from '../models/Rental.entity';
import { Penalty } from '../models/Penalty.entity';
import { User } from '../models/User.entity';

// Load environment variables
require('dotenv').config();

/**
 * Script to clean all fake/test data from database
 * This will delete all records from: penalties, rentals, cars, clients, users
 * Tables structure will remain intact
 */
async function clean() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
    }

    const carRepository = AppDataSource.getRepository(Car);
    const clientRepository = AppDataSource.getRepository(Client);
    const rentalRepository = AppDataSource.getRepository(Rental);
    const penaltyRepository = AppDataSource.getRepository(Penalty);
    const userRepository = AppDataSource.getRepository(User);

    console.log('\n🗑️  Starting database cleanup...\n');

    // Count records before deletion
    const [penaltiesCount, rentalsCount, carsCount, clientsCount, usersCount] = await Promise.all([
      penaltyRepository.count(),
      rentalRepository.count(),
      carRepository.count(),
      clientRepository.count(),
      userRepository.count(),
    ]);

    console.log('📊 Current data count:');
    console.log(`   - Penalties: ${penaltiesCount}`);
    console.log(`   - Rentals: ${rentalsCount}`);
    console.log(`   - Cars: ${carsCount}`);
    console.log(`   - Clients: ${clientsCount}`);
    console.log(`   - Users: ${usersCount}`);

    // Delete all data using TRUNCATE CASCADE to handle foreign key constraints
    // This is the safest and fastest way to clear all tables
    console.log('\n🧹 Deleting data...');
    
    // Use TRUNCATE CASCADE to delete all data respecting foreign key constraints
    await AppDataSource.query('TRUNCATE TABLE penalties, rentals, cars, clients, users CASCADE');
    console.log('   ✓ All data deleted successfully');

    // Verify deletion
    const [penaltiesAfter, rentalsAfter, carsAfter, clientsAfter, usersAfter] = await Promise.all([
      penaltyRepository.count(),
      rentalRepository.count(),
      carRepository.count(),
      clientRepository.count(),
      userRepository.count(),
    ]);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\n📊 Data count after cleanup:');
    console.log(`   - Penalties: ${penaltiesAfter}`);
    console.log(`   - Rentals: ${rentalsAfter}`);
    console.log(`   - Cars: ${carsAfter}`);
    console.log(`   - Clients: ${clientsAfter}`);
    console.log(`   - Users: ${usersAfter}`);
    console.log('\n💡 Note: Table structures are preserved. You can run seed script to populate data again.');

  } catch (error) {
    console.error('\n❌ Error cleaning database:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run clean script
clean()
  .then(() => {
    console.log('\n✨ Clean script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Clean script failed:', error);
    process.exit(1);
  });

