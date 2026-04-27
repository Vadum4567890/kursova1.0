# Database Schemas

Цей документ містить схеми баз даних для всіх мікросервісів.

## PostgreSQL (Основна БД)

### Users Service Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('renter', 'owner', 'both', 'admin')),
  verified_status VARCHAR(20) DEFAULT 'pending' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  birth_date DATE,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Ukraine',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User documents
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('passport', 'driving_license', 'tax_id', 'other')),
  doc_number VARCHAR(100),
  doc_image_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User ratings
CREATE TABLE user_ratings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  as_renter_rating DECIMAL(3,2) DEFAULT 0.00,
  as_renter_count INTEGER DEFAULT 0,
  as_owner_rating DECIMAL(3,2) DEFAULT 0.00,
  as_owner_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_verified ON user_documents(verified);
```

### Car Service Schema

```sql
-- Cars table
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  vin VARCHAR(17) UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('economy', 'comfort', 'premium', 'suv', 'luxury')),
  transmission VARCHAR(20) NOT NULL CHECK (transmission IN ('manual', 'automatic', 'cvt')),
  fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER NOT NULL CHECK (seats >= 2 AND seats <= 9),
  mileage INTEGER DEFAULT 0,
  color VARCHAR(50),
  license_plate VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'deleted')),
  description TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  instant_book BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car pricing
CREATE TABLE car_pricing (
  car_id UUID PRIMARY KEY REFERENCES cars(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2) NOT NULL,
  weekly_rate DECIMAL(10, 2),
  monthly_rate DECIMAL(10, 2),
  deposit_required BOOLEAN DEFAULT TRUE,
  deposit_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'UAH',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car features
CREATE TABLE car_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(car_id, feature_name)
);

-- Car availability
CREATE TABLE car_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  blocked_reason TEXT,
  blocked_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(car_id, date)
);

-- Car images
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car documents
CREATE TABLE car_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('registration', 'insurance', 'inspection', 'other')),
  doc_url TEXT NOT NULL,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_cars_owner_id ON cars(owner_id);
CREATE INDEX idx_cars_category ON cars(category);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_location ON cars(location_latitude, location_longitude);
CREATE INDEX idx_car_availability_car_id ON car_availability(car_id);
CREATE INDEX idx_car_availability_date ON car_availability(date);
CREATE INDEX idx_car_images_car_id ON car_images(car_id);
```

### Rental Service Schema

```sql
-- Rentals table
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,
  renter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'active', 'completed', 'disputed')),
  total_cost DECIMAL(10, 2) NOT NULL,
  base_cost DECIMAL(10, 2) NOT NULL,
  insurance_cost DECIMAL(10, 2) DEFAULT 0,
  deposit_held DECIMAL(10, 2) DEFAULT 0,
  deposit_released BOOLEAN DEFAULT FALSE,
  insurance_type VARCHAR(50),
  pickup_location TEXT,
  dropoff_location TEXT,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

-- Rental timeline
CREATE TABLE rental_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id),
  notes TEXT,
  images TEXT[],
  metadata JSONB
);

-- Rental damages
CREATE TABLE rental_damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost DECIMAL(10, 2) DEFAULT 0,
  images TEXT[],
  reported_by UUID NOT NULL REFERENCES users(id),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rental extensions
CREATE TABLE rental_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  new_end_date DATE NOT NULL,
  additional_cost DECIMAL(10, 2) NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_rentals_car_id ON rentals(car_id);
CREATE INDEX idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rental_timeline_rental_id ON rental_timeline(rental_id);
```

### Payment Service Schema

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UAH',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'apple_pay', 'google_pay', 'monobank', 'other')),
  stripe_payment_id VARCHAR(255),
  stripe_intent_id VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id VARCHAR(255),
  scheduled_date DATE,
  payout_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  payout_id UUID REFERENCES payouts(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'payout', 'refund', 'fee')),
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposit holds
CREATE TABLE deposit_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP,
  released_amount DECIMAL(10, 2),
  deducted_amount DECIMAL(10, 2) DEFAULT 0,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'released', 'deducted', 'partial'))
);

-- Indexes
CREATE INDEX idx_payments_rental_id ON payments(rental_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payouts_owner_id ON payouts(owner_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

### Review Service Schema

```sql
-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  accuracy INTEGER CHECK (accuracy >= 1 AND accuracy <= 5),
  location INTEGER CHECK (location >= 1 AND location <= 5),
  value INTEGER CHECK (value >= 1 AND value <= 5),
  comment TEXT,
  images TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rental_id, reviewer_id)
);

-- Review responses
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review reports
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reviews_rental_id ON reviews(rental_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_car_id ON reviews(car_id);
CREATE INDEX idx_reviews_published ON reviews(published);
```

## MongoDB (Chat Service)

### Collections

```javascript
// Conversations collection
{
  _id: ObjectId,
  participants: [ObjectId], // user IDs
  rental_id: String, // UUID from PostgreSQL
  type: String, // 'rental' | 'support'
  last_message: String,
  last_message_at: ISODate,
  unread_count: {
    [userId]: Number
  },
  created_at: ISODate,
  updated_at: ISODate
}

// Messages collection
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: String, // UUID from PostgreSQL
  content: String,
  type: String, // 'text' | 'image' | 'file'
  attachments: [{
    url: String,
    type: String,
    size: Number
  }],
  read_by: [String], // user IDs
  created_at: ISODate,
  updated_at: ISODate
}
```

## TimescaleDB (для майбутнього IoT Service)

```sql
-- Vehicle telemetry (hypertable)
CREATE TABLE vehicle_telemetry (
  time TIMESTAMPTZ NOT NULL,
  car_id UUID NOT NULL,
  rental_id UUID,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed INTEGER, -- km/h
  fuel_level INTEGER, -- percentage
  mileage INTEGER,
  engine_status BOOLEAN,
  battery_voltage DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('vehicle_telemetry', 'time');

-- Geofence violations
CREATE TABLE geofence_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  rental_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('out_of_zone', 'speed_limit', 'curfew')),
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  resolved BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_vehicle_telemetry_car_id ON vehicle_telemetry(car_id);
CREATE INDEX idx_vehicle_telemetry_time ON vehicle_telemetry(time DESC);
CREATE INDEX idx_geofence_violations_car_id ON geofence_violations(car_id);
CREATE INDEX idx_geofence_violations_rental_id ON geofence_violations(rental_id);
```

