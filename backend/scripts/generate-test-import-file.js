/**
 * Script to generate test import file for rentals
 * Usage: node scripts/generate-test-import-file.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test data for import
// NOTE: Автомобілі повинні існувати в базі даних!
// Перевірте seed.ts для списку доступних автомобілів
// Дати мають бути в майбутньому!

// Calculate future dates (starting from tomorrow)
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatDateISO = (date) => {
  return date.toISOString().split('T')[0];
};

const getDate = (daysFromTomorrow) => {
  const date = new Date(tomorrow);
  date.setDate(date.getDate() + daysFromTomorrow);
  return date;
};

const testData = [
  {
    'Клієнт': 'Іван Петрович Коваленко',
    'Телефон': '+380501234567',
    'Email': 'ivan.kovalenko@example.com',
    'Автомобіль': 'Toyota Corolla (2020)',
    'Дата початку': formatDate(getDate(0)), // Tomorrow
    'Очікувана дата завершення': formatDate(getDate(5)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Марія Олександрівна Шевченко',
    'Телефон': '+380671234568',
    'Email': 'maria.shevchenko@example.com',
    'Автомобіль': 'BMW 3 Series (2022)',
    'Дата початку': formatDate(getDate(3)),
    'Очікувана дата завершення': formatDate(getDate(10)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Олексій Вікторович Мельник',
    'Телефон': '+380931234569',
    'Email': 'oleksiy.melnyk@example.com',
    'Автомобіль': 'Mercedes-Benz C-Class (2021)',
    'Дата початку': formatDate(getDate(7)),
    'Очікувана дата завершення': formatDate(getDate(14)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Олена Сергіївна Бондаренко',
    'Телефон': '+380501234570',
    'Email': 'olena.bondarenko@example.com',
    'Автомобіль': 'BMW X5 (2023)',
    'Дата початку': formatDate(getDate(15)),
    'Очікувана дата завершення': formatDate(getDate(20)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Дмитро Іванович Ткаченко',
    'Телефон': '+380671234571',
    'Email': 'dmytro.tkachenko@example.com',
    'Автомобіль': 'Mercedes-Benz S-Class (2022)',
    'Дата початку': formatDate(getDate(25)),
    'Очікувана дата завершення': formatDate(getDate(30)),
    'Статус': 'Активний',
  },
  // Test case: without phone (only email)
  {
    'Клієнт': 'Анна Петрівна Лисенко',
    'Телефон': '',
    'Email': 'anna.lysenko@example.com',
    'Автомобіль': 'Toyota Corolla (2020)',
    'Дата початку': formatDate(getDate(35)),
    'Очікувана дата завершення': formatDate(getDate(40)),
    'Статус': 'Активний',
  },
  // Test case: without email (only phone)
  {
    'Клієнт': 'Василь Миколайович Гриценко',
    'Телефон': '+380501234572',
    'Email': '',
    'Автомобіль': 'BMW 3 Series (2022)',
    'Дата початку': formatDate(getDate(45)),
    'Очікувана дата завершення': formatDate(getDate(50)),
    'Статус': 'Активний',
  },
  // Test case: different date format (ISO)
  {
    'Клієнт': 'Наталія Володимирівна Кравченко',
    'Телефон': '+380931234573',
    'Email': 'natalia.kravchenko@example.com',
    'Автомобіль': 'Mercedes-Benz C-Class (2021)',
    'Дата початку': formatDateISO(getDate(55)),
    'Очікувана дата завершення': formatDateISO(getDate(60)),
    'Статус': 'Активний',
  },
  // Additional test rentals with different cars
  {
    'Клієнт': 'Сергій Олександрович Мороз',
    'Телефон': '+380501234574',
    'Email': 'serhiy.moroz@example.com',
    'Автомобіль': 'Porsche Cayenne (2023)',
    'Дата початку': formatDate(getDate(65)),
    'Очікувана дата завершення': formatDate(getDate(70)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Юлія Вікторівна Коваль',
    'Телефон': '+380671234575',
    'Email': 'yuliya.koval@example.com',
    'Автомобіль': 'BMW X5 (2023)',
    'Дата початку': formatDate(getDate(75)),
    'Очікувана дата завершення': formatDate(getDate(80)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Андрій Сергійович Петренко',
    'Телефон': '+380931234576',
    'Email': 'andriy.petrenko@example.com',
    'Автомобіль': 'Mercedes-Benz S-Class (2022)',
    'Дата початку': formatDate(getDate(85)),
    'Очікувана дата завершення': formatDate(getDate(90)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Оксана Миколаївна Захарченко',
    'Телефон': '+380501234577',
    'Email': 'oksana.zakharchenko@example.com',
    'Автомобіль': 'BMW 3 Series (2022)',
    'Дата початку': formatDate(getDate(95)),
    'Очікувана дата завершення': formatDate(getDate(100)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Володимир Іванович Семененко',
    'Телефон': '+380671234578',
    'Email': 'volodymyr.semenenko@example.com',
    'Автомобіль': 'Toyota Corolla (2020)',
    'Дата початку': formatDate(getDate(105)),
    'Очікувана дата завершення': formatDate(getDate(110)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Тетяна Олександрівна Романенко',
    'Телефон': '+380931234579',
    'Email': 'tetiana.romanenko@example.com',
    'Автомобіль': 'Porsche Cayenne (2023)',
    'Дата початку': formatDate(getDate(115)),
    'Очікувана дата завершення': formatDate(getDate(120)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Максим Вікторович Левченко',
    'Телефон': '+380501234580',
    'Email': 'maksym.levchenko@example.com',
    'Автомобіль': 'Mercedes-Benz C-Class (2021)',
    'Дата початку': formatDate(getDate(125)),
    'Очікувана дата завершення': formatDate(getDate(130)),
    'Статус': 'Активний',
  },
  // Additional rentals with different cars
  {
    'Клієнт': 'Олег Петрович Сидоренко',
    'Телефон': '+380671234581',
    'Email': 'oleh.sydorenko@example.com',
    'Автомобіль': 'Toyota Corolla (2020)',
    'Дата початку': formatDate(getDate(135)),
    'Очікувана дата завершення': formatDate(getDate(140)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Ірина Володимирівна Павленко',
    'Телефон': '+380931234582',
    'Email': 'iryna.pavlenko@example.com',
    'Автомобіль': 'BMW X5 (2023)',
    'Дата початку': formatDate(getDate(145)),
    'Очікувана дата завершення': formatDate(getDate(150)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Роман Сергійович Білоус',
    'Телефон': '+380501234583',
    'Email': 'roman.bilous@example.com',
    'Автомобіль': 'Porsche Cayenne (2023)',
    'Дата початку': formatDate(getDate(155)),
    'Очікувана дата завершення': formatDate(getDate(160)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Людмила Олександрівна Гончар',
    'Телефон': '+380671234584',
    'Email': 'lyudmyla.honchar@example.com',
    'Автомобіль': 'BMW 3 Series (2022)',
    'Дата початку': formatDate(getDate(165)),
    'Очікувана дата завершення': formatDate(getDate(170)),
    'Статус': 'Активний',
  },
  {
    'Клієнт': 'Віктор Миколайович Демченко',
    'Телефон': '+380931234585',
    'Email': 'viktor.demchenko@example.com',
    'Автомобіль': 'Mercedes-Benz S-Class (2022)',
    'Дата початку': formatDate(getDate(175)),
    'Очікувана дата завершення': formatDate(getDate(180)),
    'Статус': 'Активний',
  },
];

// Create workbook and worksheet
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Прокати');

// Generate file paths
const outputDir = path.join(__dirname, '../test-files');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const excelPath = path.join(outputDir, 'test_rentals_import.xlsx');
const csvPath = path.join(outputDir, 'test_rentals_import.csv');

// Write Excel file
XLSX.writeFile(workbook, excelPath, {
  bookType: 'xlsx',
  cellStyles: true,
});

// Write CSV file
const csv = XLSX.utils.sheet_to_csv(worksheet);
fs.writeFileSync(csvPath, '\ufeff' + csv, 'utf-8'); // Add BOM for UTF-8

console.log('✅ Тестові файли створено:');
console.log(`   Excel: ${excelPath}`);
console.log(`   CSV: ${csvPath}`);
console.log(`\n📋 Створено ${testData.length} тестових записів`);
console.log('\n💡 Використання:');
console.log('   1. Перевірте, що автомобілі з тестових даних існують в системі');
console.log('   2. Завантажте файл через діалог імпорту');
console.log('   3. Перевірте результат імпорту');

