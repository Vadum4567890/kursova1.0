import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Car, CarType, CarStatus } from '../models/Car.entity';
import { Client } from '../models/Client.entity';
import { Rental, RentalStatus } from '../models/Rental.entity';
import { Penalty } from '../models/Penalty.entity';
import { AppDataSource } from './data-source';

// Load environment variables
require('dotenv').config();

/**
 * Seed script to populate database with initial data
 */
async function seed() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected');
    }

    const carRepository = AppDataSource.getRepository(Car);
    const clientRepository = AppDataSource.getRepository(Client);
    const rentalRepository = AppDataSource.getRepository(Rental);
    const penaltyRepository = AppDataSource.getRepository(Penalty);

    // Clear existing data (optional - comment out if you want to keep existing data)
    // Must use CASCADE to handle foreign key constraints
    console.log('Clearing existing data...');
    await AppDataSource.query('TRUNCATE TABLE penalties, rentals, cars, clients CASCADE');

    // Create Cars
    console.log('Creating cars...');
    const cars = [
      // Economy cars
      carRepository.create({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        type: CarType.ECONOMY,
        pricePerDay: 800,
        deposit: 3000,
        status: CarStatus.AVAILABLE,
        description: 'Надійний економ-клас, ідеальний для міста',
        imageUrl: 'https://example.com/toyota-corolla.jpg',
      }),
      carRepository.create({
        brand: 'Hyundai',
        model: 'Elantra',
        year: 2019,
        type: CarType.ECONOMY,
        pricePerDay: 750,
        deposit: 3000,
        status: CarStatus.AVAILABLE,
        description: 'Комфортний седан економ-класу',
      }),
      carRepository.create({
        brand: 'Kia',
        model: 'Rio',
        year: 2021,
        type: CarType.ECONOMY,
        pricePerDay: 700,
        deposit: 2500,
        status: CarStatus.AVAILABLE,
        description: 'Сучасний компактний автомобіль',
      }),

      // Business cars
      carRepository.create({
        brand: 'BMW',
        model: '3 Series',
        year: 2022,
        type: CarType.BUSINESS,
        pricePerDay: 1500,
        deposit: 10000,
        status: CarStatus.AVAILABLE,
        description: 'Преміум седан бізнес-класу',
        imageUrl: 'https://example.com/bmw-3.jpg',
      }),
      carRepository.create({
        brand: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2021,
        type: CarType.BUSINESS,
        pricePerDay: 1600,
        deposit: 12000,
        status: CarStatus.AVAILABLE,
        description: 'Елегантний бізнес-седан',
      }),
      carRepository.create({
        brand: 'Audi',
        model: 'A4',
        year: 2023,
        type: CarType.BUSINESS,
        pricePerDay: 1700,
        deposit: 15000,
        status: CarStatus.AVAILABLE,
        description: 'Сучасний бізнес-седан з передовою технологією',
      }),

      // Premium cars
      carRepository.create({
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        type: CarType.PREMIUM,
        pricePerDay: 3000,
        deposit: 20000,
        status: CarStatus.AVAILABLE,
        description: 'Розкішний позашляховик преміум-класу',
        imageUrl: 'https://example.com/bmw-x5.jpg',
      }),
      carRepository.create({
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        year: 2022,
        type: CarType.PREMIUM,
        pricePerDay: 3500,
        deposit: 25000,
        status: CarStatus.AVAILABLE,
        description: 'Флагманський седан з максимальним комфортом',
      }),
      carRepository.create({
        brand: 'Porsche',
        model: 'Cayenne',
        year: 2023,
        type: CarType.PREMIUM,
        pricePerDay: 4000,
        deposit: 30000,
        status: CarStatus.AVAILABLE,
        description: 'Спортивний позашляховик преміум-класу',
      }),

      // Some cars in maintenance
      carRepository.create({
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        type: CarType.BUSINESS,
        pricePerDay: 1200,
        deposit: 8000,
        status: CarStatus.MAINTENANCE,
        description: 'На обслуговуванні',
      }),
    ];

    const savedCars = await carRepository.save(cars);
    console.log(`Created ${savedCars.length} cars`);

    // Create Clients
    console.log('Creating clients...');
    const clients = [
      clientRepository.create({
        fullName: 'Іван Петрович Коваленко',
        address: 'вул. Хрещатик, 1, кв. 10, м. Київ',
        phone: '+380501234567',
        registrationDate: new Date('2024-01-15'),
      }),
      clientRepository.create({
        fullName: 'Марія Олександрівна Шевченко',
        address: 'вул. Саксаганського, 25, кв. 5, м. Київ',
        phone: '+380671234568',
        registrationDate: new Date('2024-02-20'),
      }),
      clientRepository.create({
        fullName: 'Олексій Вікторович Мельник',
        address: 'пр. Перемоги, 50, кв. 12, м. Київ',
        phone: '+380931234569',
        registrationDate: new Date('2024-03-10'),
      }),
      clientRepository.create({
        fullName: 'Олена Сергіївна Бондаренко',
        address: 'вул. Львівська, 100, кв. 8, м. Львів',
        phone: '+380501234570',
        registrationDate: new Date('2024-04-05'),
      }),
      clientRepository.create({
        fullName: 'Дмитро Іванович Ткаченко',
        address: 'вул. Сумська, 75, кв. 15, м. Харків',
        phone: '+380671234571',
        registrationDate: new Date('2024-05-12'),
      }),
    ];

    const savedClients = await clientRepository.save(clients);
    console.log(`Created ${savedClients.length} clients`);

    // Create Rentals (some active, some completed)
    console.log('Creating rentals...');
    const now = new Date();
    const rentals = [
      // Active rental
      rentalRepository.create({
        client: savedClients[0],
        car: savedCars[0], // Toyota Corolla
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expectedEndDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        depositAmount: 3000,
        totalCost: 5600, // 7 days * 800
        penaltyAmount: 0,
        status: RentalStatus.ACTIVE,
      }),

      // Completed rental
      rentalRepository.create({
        client: savedClients[1],
        car: savedCars[3], // BMW 3 Series
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        expectedEndDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        actualEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (returned 1 day late)
        depositAmount: 10000,
        totalCost: 10500, // 7 days * 1500
        penaltyAmount: 750, // Late return penalty
        status: RentalStatus.COMPLETED,
      }),

      // Another completed rental
      rentalRepository.create({
        client: savedClients[2],
        car: savedCars[4], // Mercedes C-Class
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        expectedEndDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
        actualEndDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000), // Returned on time
        depositAmount: 12000,
        totalCost: 11200, // 7 days * 1600
        penaltyAmount: 0,
        status: RentalStatus.COMPLETED,
      }),

      // Another active rental
      rentalRepository.create({
        client: savedClients[3],
        car: savedCars[6], // BMW X5
        startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        expectedEndDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        depositAmount: 20000,
        totalCost: 21000, // 7 days * 3000
        penaltyAmount: 0,
        status: RentalStatus.ACTIVE,
      }),
    ];

    const savedRentals = await rentalRepository.save(rentals);
    console.log(`Created ${savedRentals.length} rentals`);

    // Update car statuses for rented cars
    await carRepository.update(savedCars[0].id, { status: CarStatus.RENTED });
    await carRepository.update(savedCars[6].id, { status: CarStatus.RENTED });

    console.log('\n✅ Seed completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Cars: ${savedCars.length} (${savedCars.filter(c => c.status === CarStatus.AVAILABLE).length} available, ${savedCars.filter(c => c.status === CarStatus.RENTED).length} rented, ${savedCars.filter(c => c.status === CarStatus.MAINTENANCE).length} in maintenance)`);
    console.log(`- Clients: ${savedClients.length}`);
    console.log(`- Rentals: ${savedRentals.length} (${savedRentals.filter(r => r.status === RentalStatus.ACTIVE).length} active, ${savedRentals.filter(r => r.status === RentalStatus.COMPLETED).length} completed)`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run seed
seed()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });

