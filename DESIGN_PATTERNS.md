# GoF-патерни проектування в системі прокату автомобілів

## 📋 Огляд застосованих патернів

Згідно з додатком А (популярність GoF-патернів) та додатком В (діаграма класів), в проекті будуть використані наступні патерни:

1. **Singleton** (рожевий) - ⭐⭐⭐⭐⭐ Найпопулярніший
2. **Factory Method** (коричневий) - ⭐⭐⭐⭐
3. **Builder** (помаранчевий) - ⭐⭐⭐
4. **Strategy** (зелений) - ⭐⭐⭐⭐⭐ Найпопулярніший
5. **Template Method** (жовтий) - ⭐⭐⭐
6. **Observer** (зелений) - ⭐⭐⭐⭐⭐ Найпопулярніший

---

## 1. Singleton Pattern (Рожевий) ⭐⭐⭐⭐⭐

### Призначення
Забезпечує існування лише одного екземпляра класу в системі.

### Застосування в проекті

#### 1.1 Database Connection Singleton
**Актуальність**: Підключення до БД має бути єдиним для всієї системи, щоб уникнути зайвих з'єднань та забезпечити ефективне використання ресурсів.

```typescript
// database/DatabaseConnection.ts
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: DataSource;

  private constructor() {
    this.connection = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getConnection(): DataSource {
    return this.connection;
  }

  public async connect(): Promise<void> {
    if (!this.connection.isInitialized) {
      await this.connection.initialize();
    }
  }
}
```

**Використання:**
```typescript
const db = DatabaseConnection.getInstance();
await db.connect();
const connection = db.getConnection();
```

#### 1.2 Logger Singleton
**Актуальність**: Централізоване логування для всієї системи.

```typescript
// utils/Logger.ts
export class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}
```

#### 1.3 Configuration Manager Singleton
**Актуальність**: Централізоване управління конфігурацією.

```typescript
// config/ConfigManager.ts
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any>;

  private constructor() {
    this.config = {
      db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
      },
      app: {
        port: parseInt(process.env.PORT || '3000'),
        jwtSecret: process.env.JWT_SECRET || 'default-secret',
      },
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get(key: string): any {
    return this.config[key];
  }
}
```

---

## 2. Factory Method Pattern (Коричневий) ⭐⭐⭐⭐

### Призначення
Визначає інтерфейс для створення об'єктів, але дозволяє підкласам вирішувати, який клас інстанціювати.

### Застосування в проекті

#### 2.1 Car Factory
**Актуальність**: Різні типи автомобілів (Економ, Бізнес, Преміум) потребують різної логіки створення та ініціалізації.

```typescript
// patterns/factory/CarFactory.ts
export abstract class CarFactory {
  public abstract createCar(data: CarData): Car;

  public registerCar(data: CarData): Car {
    const car = this.createCar(data);
    car.calculateInitialPrice();
    return car;
  }
}

// Конкретні фабрики
export class EconomyCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    return new EconomyCar(data);
  }
}

export class BusinessCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    return new BusinessCar(data);
  }
}

export class PremiumCarFactory extends CarFactory {
  public createCar(data: CarData): Car {
    return new PremiumCar(data);
  }
}

// Використання
export class CarFactoryProvider {
  public static getFactory(carType: CarType): CarFactory {
    switch (carType) {
      case CarType.ECONOMY:
        return new EconomyCarFactory();
      case CarType.BUSINESS:
        return new BusinessCarFactory();
      case CarType.PREMIUM:
        return new PremiumCarFactory();
      default:
        throw new Error(`Unknown car type: ${carType}`);
    }
  }
}
```

#### 2.2 Report Factory
**Актуальність**: Різні типи звітів (Фінансовий, Зайнятість, Наявність) мають різну структуру та логіку генерації.

```typescript
// patterns/factory/ReportFactory.ts
export abstract class ReportFactory {
  public abstract createReport(): Report;

  public generateReport(): Report {
    const report = this.createReport();
    report.generate();
    return report;
  }
}

export class FinancialReportFactory extends ReportFactory {
  public createReport(): Report {
    return new FinancialReport();
  }
}

export class OccupancyReportFactory extends ReportFactory {
  public createReport(): Report {
    return new OccupancyReport();
  }
}

export class AvailabilityReportFactory extends ReportFactory {
  public createReport(): Report {
    return new AvailabilityReport();
  }
}
```

---

## 3. Builder Pattern (Помаранчевий) ⭐⭐⭐

### Призначення
Побудова складних об'єктів покроково, дозволяє створювати різні представлення об'єкта.

### Застосування в проекті

#### 3.1 Rental Builder
**Актуальність**: Створення угоди прокату - складний процес з багатьма параметрами (клієнт, автомобіль, дати, застава, розрахунок ціни). Builder спрощує та робить процес більш читабельним.

```typescript
// patterns/builder/RentalBuilder.ts
export class RentalBuilder {
  private rental: Partial<Rental> = {};

  public setClient(client: Client): this {
    this.rental.client = client;
    return this;
  }

  public setCar(car: Car): this {
    this.rental.car = car;
    this.rental.depositAmount = car.deposit;
    return this;
  }

  public setDates(startDate: Date, expectedEndDate: Date): this {
    this.rental.startDate = startDate;
    this.rental.expectedEndDate = expectedEndDate;
    return this;
  }

  public calculateCost(pricingStrategy: PricingStrategy): this {
    const days = this.calculateDays();
    this.rental.totalCost = pricingStrategy.calculatePrice(
      this.rental.car!,
      days
    );
    return this;
  }

  public setStatus(status: RentalStatus): this {
    this.rental.status = status;
    return this;
  }

  private calculateDays(): number {
    const diff = this.rental.expectedEndDate!.getTime() - 
                 this.rental.startDate!.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  public build(): Rental {
    if (!this.rental.client || !this.rental.car || !this.rental.startDate) {
      throw new Error('Missing required rental fields');
    }
    return this.rental as Rental;
  }
}

// Використання
const rental = new RentalBuilder()
  .setClient(client)
  .setCar(car)
  .setDates(startDate, endDate)
  .calculateCost(pricingStrategy)
  .setStatus(RentalStatus.ACTIVE)
  .build();
```

---

## 4. Strategy Pattern (Зелений) ⭐⭐⭐⭐⭐

### Призначення
Визначає сімейство алгоритмів, інкапсулює кожен з них і робить їх взаємозамінними.

### Застосування в проекті

#### 4.1 Pricing Strategy
**Актуальність**: Вартість прокату залежить від різних факторів (автомобіль, термін, рік випуску). Різні стратегії дозволяють гнучко змінювати логіку розрахунку.

```typescript
// patterns/strategy/PricingStrategy.ts
export interface PricingStrategy {
  calculatePrice(car: Car, days: number): number;
}

// Базова стратегія - проста ціна за день
export class BasePricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    return car.pricePerDay * days;
  }
}

// Стратегія з урахуванням року випуску
export class YearBasedPricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - car.year;
    
    // Новіші автомобілі дорожчі
    let multiplier = 1.0;
    if (age <= 2) multiplier = 1.2;
    else if (age <= 5) multiplier = 1.0;
    else if (age <= 10) multiplier = 0.9;
    else multiplier = 0.8;
    
    return car.pricePerDay * days * multiplier;
  }
}

// Стратегія з урахуванням тривалості (довші терміни - знижка)
export class DurationBasedPricingStrategy implements PricingStrategy {
  public calculatePrice(car: Car, days: number): number {
    let discount = 0;
    if (days >= 30) discount = 0.15; // 15% знижка на місяць+
    else if (days >= 14) discount = 0.10; // 10% знижка на 2 тижні+
    else if (days >= 7) discount = 0.05; // 5% знижка на тиждень+
    
    const basePrice = car.pricePerDay * days;
    return basePrice * (1 - discount);
  }
}

// Комбінована стратегія
export class CombinedPricingStrategy implements PricingStrategy {
  constructor(
    private strategies: PricingStrategy[]
  ) {}

  public calculatePrice(car: Car, days: number): number {
    let totalPrice = 0;
    for (const strategy of this.strategies) {
      totalPrice += strategy.calculatePrice(car, days);
    }
    return totalPrice / this.strategies.length; // Середнє значення
  }
}

// Контекст використання
export class RentalService {
  private pricingStrategy: PricingStrategy;

  constructor(pricingStrategy: PricingStrategy) {
    this.pricingStrategy = pricingStrategy;
  }

  public setPricingStrategy(strategy: PricingStrategy): void {
    this.pricingStrategy = strategy;
  }

  public calculateRentalPrice(car: Car, days: number): number {
    return this.pricingStrategy.calculatePrice(car, days);
  }
}

// Використання
const strategy = new CombinedPricingStrategy([
  new BasePricingStrategy(),
  new YearBasedPricingStrategy(),
  new DurationBasedPricingStrategy()
]);

const rentalService = new RentalService(strategy);
const price = rentalService.calculateRentalPrice(car, 10);
```

---

## 5. Template Method Pattern (Жовтий) ⭐⭐⭐

### Призначення
Визначає скелет алгоритму в базовому класі, дозволяючи підкласам перевизначати окремі кроки.

### Застосування в проекті

#### 5.1 Report Template
**Актуальність**: Всі звіти мають схожу структуру (збір даних, обробка, форматування, експорт), але різну логіку на кожному етапі.

```typescript
// patterns/template/ReportTemplate.ts
export abstract class ReportTemplate {
  // Template Method - визначає алгоритм
  public generate(): ReportResult {
    const data = this.collectData();
    const processedData = this.processData(data);
    const formattedData = this.formatData(processedData);
    return this.exportData(formattedData);
  }

  // Абстрактні методи - мають бути реалізовані в підкласах
  protected abstract collectData(): any;
  protected abstract processData(data: any): any;
  protected abstract formatData(data: any): any;

  // Хук - можна перевизначити
  protected exportData(data: any): ReportResult {
    return {
      data,
      format: 'json',
      timestamp: new Date(),
    };
  }
}

// Конкретні реалізації
export class FinancialReport extends ReportTemplate {
  protected collectData(): any {
    // Збір фінансових даних
    return {
      totalRevenue: 0,
      totalCosts: 0,
      rentals: [],
    };
  }

  protected processData(data: any): any {
    // Обробка фінансових даних
    return {
      ...data,
      totalRevenue: data.rentals.reduce((sum, r) => sum + r.totalCost, 0),
      profit: data.totalRevenue - data.totalCosts,
    };
  }

  protected formatData(data: any): any {
    // Форматування для фінансового звіту
    return {
      title: 'Financial Report',
      period: '2024',
      summary: {
        revenue: data.totalRevenue,
        costs: data.totalCosts,
        profit: data.profit,
      },
      details: data.rentals,
    };
  }
}

export class OccupancyReport extends ReportTemplate {
  protected collectData(): any {
    // Збір даних про зайнятість
    return {
      cars: [],
      rentals: [],
    };
  }

  protected processData(data: any): any {
    // Розрахунок зайнятості
    const occupancy = data.cars.map(car => ({
      carId: car.id,
      carModel: `${car.brand} ${car.model}`,
      occupancyRate: this.calculateOccupancyRate(car, data.rentals),
    }));
    return { occupancy };
  }

  protected formatData(data: any): any {
    return {
      title: 'Occupancy Report',
      averageOccupancy: this.calculateAverage(data.occupancy),
      details: data.occupancy,
    };
  }

  private calculateOccupancyRate(car: Car, rentals: Rental[]): number {
    // Логіка розрахунку
    return 0.75; // Приклад
  }

  private calculateAverage(occupancy: any[]): number {
    // Логіка розрахунку середнього
    return 0.7;
  }
}

export class AvailabilityReport extends ReportTemplate {
  protected collectData(): any {
    return {
      availableCars: [],
      rentedCars: [],
      maintenanceCars: [],
    };
  }

  protected processData(data: any): any {
    return {
      total: data.availableCars.length + 
             data.rentedCars.length + 
             data.maintenanceCars.length,
      available: data.availableCars.length,
      rented: data.rentedCars.length,
      maintenance: data.maintenanceCars.length,
    };
  }

  protected formatData(data: any): any {
    return {
      title: 'Availability Report',
      statistics: data,
      timestamp: new Date(),
    };
  }
}
```

---

## 6. Observer Pattern (Зелений) ⭐⭐⭐⭐⭐

### Призначення
Визначає залежність "один-до-багатьох" між об'єктами, щоб при зміні стану одного об'єкта всі залежні об'єкти отримували сповіщення.

### Застосування в проекті

#### 6.1 Rental Observer
**Актуальність**: При зміні статусу угоди (створення, завершення, скасування) потрібно сповіщати різні системи (логінг, нотифікації, оновлення статусу автомобіля).

```typescript
// patterns/observer/Observer.ts
export interface Observer {
  update(event: string, data: any): void;
}

export interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(event: string, data: any): void;
}

// Subject - Rental
export class RentalSubject implements Subject {
  private observers: Observer[] = [];
  private rental: Rental;

  constructor(rental: Rental) {
    this.rental = rental;
  }

  public attach(observer: Observer): void {
    this.observers.push(observer);
  }

  public detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public notify(event: string, data: any): void {
    for (const observer of this.observers) {
      observer.update(event, data);
    }
  }

  public setStatus(status: RentalStatus): void {
    const oldStatus = this.rental.status;
    this.rental.status = status;
    this.notify('status_changed', {
      rental: this.rental,
      oldStatus,
      newStatus: status,
    });
  }

  public complete(): void {
    this.setStatus(RentalStatus.COMPLETED);
    this.notify('rental_completed', {
      rental: this.rental,
    });
  }
}

// Конкретні Observers
export class CarStatusObserver implements Observer {
  public update(event: string, data: any): void {
    if (event === 'status_changed') {
      const { rental, newStatus } = data;
      
      if (newStatus === RentalStatus.ACTIVE) {
        // Автомобіль стає зайнятим
        rental.car.status = CarStatus.RENTED;
      } else if (newStatus === RentalStatus.COMPLETED) {
        // Автомобіль стає доступним
        rental.car.status = CarStatus.AVAILABLE;
      }
    }
  }
}

export class NotificationObserver implements Observer {
  public update(event: string, data: any): void {
    if (event === 'rental_completed') {
      const { rental } = data;
      // Відправка email/SMS клієнту
      console.log(`Sending notification to client ${rental.client.fullName}`);
    }
  }
}

export class LoggingObserver implements Observer {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  public update(event: string, data: any): void {
    this.logger.log(`Event: ${event}, Data: ${JSON.stringify(data)}`);
  }
}

// Використання
const rental = new RentalSubject(rentalData);

// Підписка спостерігачів
rental.attach(new CarStatusObserver());
rental.attach(new NotificationObserver());
rental.attach(new LoggingObserver());

// Зміна статусу автоматично сповістить всіх спостерігачів
rental.setStatus(RentalStatus.ACTIVE);
rental.complete();
```

---

## 🔗 Взаємодія патернів

### Приклад комплексного використання:

```typescript
// Створення угоди прокату з використанням кількох патернів
export class RentalService {
  public async createRental(data: CreateRentalDto): Promise<Rental> {
    // 1. Factory - створення автомобіля (якщо потрібно)
    const carFactory = CarFactoryProvider.getFactory(data.carType);
    const car = await this.carRepository.findById(data.carId);

    // 2. Strategy - вибір стратегії розрахунку ціни
    const pricingStrategy = this.selectPricingStrategy(data);
    
    // 3. Builder - побудова угоди
    const rentalBuilder = new RentalBuilder()
      .setClient(await this.clientRepository.findById(data.clientId))
      .setCar(car)
      .setDates(data.startDate, data.expectedEndDate)
      .calculateCost(pricingStrategy)
      .setStatus(RentalStatus.ACTIVE);

    const rental = rentalBuilder.build();

    // 4. Observer - підписка на події
    const rentalSubject = new RentalSubject(rental);
    rentalSubject.attach(new CarStatusObserver());
    rentalSubject.attach(new NotificationObserver());
    rentalSubject.attach(new LoggingObserver());

    // Збереження
    const savedRental = await this.rentalRepository.save(rental);
    
    // Сповіщення про створення
    rentalSubject.notify('rental_created', { rental: savedRental });

    return savedRental;
  }

  private selectPricingStrategy(data: CreateRentalDto): PricingStrategy {
    // Логіка вибору стратегії
    return new CombinedPricingStrategy([
      new BasePricingStrategy(),
      new YearBasedPricingStrategy(),
      new DurationBasedPricingStrategy(),
    ]);
  }
}
```

---

## 📊 Діаграма взаємодії патернів

```
┌─────────────────────────────────────────────────────────┐
│                    RentalService                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Factory    │  │   Strategy   │  │   Builder    │  │
│  │  (Car/Report)│  │  (Pricing)   │  │  (Rental)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  RentalSubject                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Observer   │  │   Observer    │  │   Observer   │ │
│  │ (CarStatus)  │  │(Notification) │  │  (Logging)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              ReportTemplate (Template Method)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Financial   │  │  Occupancy   │  │ Availability │ │
│  │    Report    │  │    Report    │  │    Report    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Переваги застосування патернів

1. **Singleton**: Ефективне використання ресурсів, централізація
2. **Factory Method**: Гнучкість створення об'єктів, розширюваність
3. **Builder**: Читабельність коду, безпека створення складних об'єктів
4. **Strategy**: Гнучкість алгоритмів, легке додавання нових стратегій
5. **Template Method**: Уніфікація алгоритмів, зменшення дублювання коду
6. **Observer**: Розв'язаність компонентів, легке додавання нової функціональності

---

**Всі патерни працюють разом для створення гнучкої, розширюваної та підтримуваної системи! 🎯**

