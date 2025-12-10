# Kafka Topics Design

## Event-Driven Architecture Topics

### User Events

#### `user.created`
**Description:** Виникає при створенні нового користувача  
**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "renter|owner|both",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service

#### `user.verified`
**Description:** Виникає після верифікації користувача  
**Payload:**
```json
{
  "userId": "uuid",
  "verificationType": "email|diia|manual",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service

#### `user.updated`
**Description:** Виникає при оновленні профілю користувача  
**Payload:**
```json
{
  "userId": "uuid",
  "updatedFields": ["firstName", "lastName"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Analytics Service

---

### Car Events

#### `car.created`
**Description:** Виникає при додаванні нового автомобіля  
**Payload:**
```json
{
  "carId": "uuid",
  "ownerId": "uuid",
  "make": "Toyota",
  "model": "Camry",
  "category": "comfort",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Analytics Service, Search Service (Elasticsearch)

#### `car.updated`
**Description:** Виникає при оновленні інформації про автомобіль  
**Payload:**
```json
{
  "carId": "uuid",
  "updatedFields": ["price", "availability"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Search Service (Elasticsearch)

#### `car.deleted`
**Description:** Виникає при видаленні автомобіля  
**Payload:**
```json
{
  "carId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Search Service (Elasticsearch), Analytics Service

---

### Rental Events

#### `rental.created`
**Description:** Виникає при створенні нового бронювання  
**Payload:**
```json
{
  "rentalId": "uuid",
  "carId": "uuid",
  "renterId": "uuid",
  "ownerId": "uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "totalCost": 5000,
  "status": "pending",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Payment Service, Analytics Service

#### `rental.confirmed`
**Description:** Виникає при підтвердженні бронювання орендодавцем  
**Payload:**
```json
{
  "rentalId": "uuid",
  "confirmedBy": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Payment Service

#### `rental.rejected`
**Description:** Виникає при відхиленні бронювання  
**Payload:**
```json
{
  "rentalId": "uuid",
  "rejectedBy": "uuid",
  "reason": "string",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service

#### `rental.cancelled`
**Description:** Виникає при скасуванні оренди  
**Payload:**
```json
{
  "rentalId": "uuid",
  "cancelledBy": "uuid",
  "reason": "string",
  "refundAmount": 0,
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Payment Service, Analytics Service

#### `rental.check-in`
**Description:** Виникає при check-in (початок оренди)  
**Payload:**
```json
{
  "rentalId": "uuid",
  "checkInTime": "2024-01-15T10:00:00Z",
  "photos": ["url1", "url2"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service

#### `rental.check-out`
**Description:** Виникає при check-out (завершення оренди)  
**Payload:**
```json
{
  "rentalId": "uuid",
  "checkOutTime": "2024-01-20T18:00:00Z",
  "photos": ["url1", "url2"],
  "damages": [],
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Payment Service, Analytics Service, Review Service

#### `rental.completed`
**Description:** Виникає після повного завершення оренди (всі платежі, депозити)  
**Payload:**
```json
{
  "rentalId": "uuid",
  "finalCost": 5000,
  "depositReleased": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Review Service, Analytics Service

---

### Payment Events

#### `payment.processed`
**Description:** Виникає після успішної обробки платежу  
**Payload:**
```json
{
  "paymentId": "uuid",
  "rentalId": "uuid",
  "userId": "uuid",
  "amount": 5000,
  "currency": "UAH",
  "status": "succeeded",
  "paymentMethod": "stripe|apple_pay|google_pay",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service, Rental Service

#### `payment.failed`
**Description:** Виникає при невдалій обробці платежу  
**Payload:**
```json
{
  "paymentId": "uuid",
  "rentalId": "uuid",
  "userId": "uuid",
  "amount": 5000,
  "error": "insufficient_funds",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Rental Service

#### `payout.scheduled`
**Description:** Виникає при запланованій виплаті орендодавцю  
**Payload:**
```json
{
  "payoutId": "uuid",
  "ownerId": "uuid",
  "rentalId": "uuid",
  "amount": 4500,
  "fee": 500,
  "scheduledDate": "2024-01-25",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service

#### `payout.completed`
**Description:** Виникає після завершення виплати  
**Payload:**
```json
{
  "payoutId": "uuid",
  "ownerId": "uuid",
  "amount": 4500,
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service

---

### Review Events

#### `review.created`
**Description:** Виникає при створенні нового відгуку  
**Payload:**
```json
{
  "reviewId": "uuid",
  "rentalId": "uuid",
  "reviewerId": "uuid",
  "revieweeId": "uuid",
  "rating": 5,
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service, Analytics Service, User Service (для оновлення рейтингу)

---

### Notification Events

#### `notification.send`
**Description:** Виникає при потребі відправити сповіщення  
**Payload:**
```json
{
  "userId": "uuid",
  "type": "rental_confirmed|new_message|review_received",
  "title": "string",
  "body": "string",
  "data": {},
  "channels": ["email", "push", "sms"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```
**Consumers:** Notification Service (внутрішній event для обробки)

---

---

## Topic Configuration

### Retention Policy
- **Default:** 7 days
- **Critical events (payments, rentals):** 30 days
- **Analytics events:** 90 days

### Replication Factor
- **Development:** 1
- **Production:** 3

### Partitions
- **High volume topics (rental.*, payment.*):** 6 partitions
- **Medium volume topics (car.*, user.*):** 3 partitions
- **Low volume topics (review.*):** 1 partition

---

## Consumer Groups

### Notification Service
- Consumes: `rental.*`, `payment.*`, `review.*`, `user.*`

### Analytics Service
- Consumes: All events

### Search Service
- Consumes: `car.*`

### Payment Service
- Consumes: `rental.confirmed`, `rental.completed`

### Review Service
- Consumes: `rental.completed`

