import https from 'https';
import fs from 'fs';
import path from 'path';

/**
 * Script to download car images from Unsplash and save them locally
 */

const UPLOADS_DIR = path.join(__dirname, '../uploads/images');
// Unique Unsplash photo IDs for each car model
// Each URL is unique and corresponds to the specific car model
const IMAGE_URLS = [
  {
    filename: 'toyota-corolla.jpg',
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop&q=80',
    car: 'Toyota Corolla'
  },
  {
    filename: 'bmw-3-series.jpg',
    url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&q=80',
    car: 'BMW 3 Series'
  },
  {
    filename: 'mercedes-c-class.jpg',
    url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&q=80',
    car: 'Mercedes-Benz C-Class'
  },
  {
    filename: 'bmw-x5.jpg',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80',
    car: 'BMW X5'
  },
  {
    filename: 'mercedes-s-class.jpg',
    url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=600&fit=crop&q=80',
    car: 'Mercedes-Benz S-Class'
  },
  {
    filename: 'porsche-cayenne.jpg',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80',
    car: 'Porsche Cayenne'
  },
  {
    filename: 'toyota-camry.jpg',
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop&q=80',
    car: 'Toyota Camry'
  },
];

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        if (response.headers.location) {
          downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect without location header`));
        }
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadAllImages() {
  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Created directory: ${UPLOADS_DIR}`);
  }

  console.log('Starting image downloads...\n');

  for (const image of IMAGE_URLS) {
    const filepath = path.join(UPLOADS_DIR, image.filename);
    
    try {
      console.log(`Downloading ${image.car}...`);
      await downloadImage(image.url, filepath);
      console.log(`✅ Downloaded: ${image.filename}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to download ${image.car}: ${error.message}\n`);
    }
  }

  console.log('✅ Image download process completed!');
  console.log(`Images saved to: ${UPLOADS_DIR}`);
}

// Run the script
downloadAllImages().catch(console.error);

