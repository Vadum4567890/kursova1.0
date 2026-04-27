# Rating System Implementation Plan

## Goal

Implement an Airbnb-style mutual review and rating system for the existing car rental marketplace.

This plan is aligned with the current service topology:

- `services/user-service`
- `services/car-service`
- `services/rental-service`
- `services/reporting-service`
- `services/api-gateway`

It assumes the following already exist in the project:

- bookings and rental lifecycle in `rental-service`
- cars and availability in `car-service`
- user profiles and aggregate user ratings in `user-service`
- analytics/export capabilities in `reporting-service`

## Current State Summary

### Already implemented

- `rental-service` owns booking creation, completion, cancellation, and booking history queries
- `car-service` owns cars, pricing, images, and date-based availability
- `user-service` already has a `user_ratings` aggregate table/entity
- `reporting-service` already exposes analytics routes

### Missing for production-grade ratings

- raw review storage
- category-based scores
- mutual review publication logic
- car rating aggregates
- review eligibility state on rentals
- review analytics
- slot-based availability model for more precise booking windows

## Recommended Architecture

## Service Responsibilities

### `rental-service`

Own:

- booking lifecycle
- rental completion state
- review eligibility
- review submission and mutual publication logic
- review status on each rental

Why here:

- reviews are strictly tied to completed rentals
- authorization is simpler because rental participants are already known here

### `user-service`

Own:

- public aggregate rating snapshot for users
- owner and renter aggregate breakdowns
- rental count per user

Do not own:

- raw review records

### `car-service`

Own:

- public aggregate rating snapshot for cars
- per-car rating breakdowns
- rental count per car
- availability calendar and blocked slots

Do not own:

- raw review records

### `reporting-service`

Own:

- analytics queries
- trend aggregation
- dashboard read models

### `api-gateway`

Own:

- external REST exposure
- response aggregation when UI needs rental + review + car + user summary in one response

## Recommended Domain Model

Use `rental-service` as the source of truth for reviews and publication workflow.

Use `user-service` and `car-service` as denormalized read models for fast public reads.

Flow:

1. Rental completes
2. Rental becomes review-eligible
3. One side submits review
4. Review remains hidden
5. Other side submits review
6. Both reviews become published
7. Aggregates are updated in `user-service` and `car-service`
8. `reporting-service` consumes review events for analytics

## Database Design

## Rental Service Schema Changes

### Extend `rentals`

Add fields to `services/rental-service/src/entities/Rental.entity.ts`:

- `ownerUserId UUID NOT NULL`
- `reviewStatus ENUM('not_available','waiting','partial','published','expired') DEFAULT 'not_available'`
- `reviewWindowClosesAt TIMESTAMP NULL`
- `ownerReviewSubmittedAt TIMESTAMP NULL`
- `renterReviewSubmittedAt TIMESTAMP NULL`

Reason:

- `ownerUserId` should be persisted at booking creation time for historical consistency
- review status should be queryable without joining review tables for every screen

### New table: `reviews`

One row per submitted review.

Fields:

- `id UUID PK`
- `booking_id UUID NOT NULL`
- `reviewer_user_id UUID NOT NULL`
- `reviewee_user_id UUID NOT NULL`
- `reviewee_type VARCHAR(20) NOT NULL`
- `car_id UUID NOT NULL`
- `review_type VARCHAR(50) NOT NULL`
- `comment TEXT NULL`
- `status VARCHAR(20) NOT NULL DEFAULT 'submitted'`
- `submitted_at TIMESTAMP NOT NULL`
- `published_at TIMESTAMP NULL`
- `created_at TIMESTAMP NOT NULL`
- `updated_at TIMESTAMP NOT NULL`

Constraints:

- unique `(booking_id, reviewer_user_id)`
- check `review_type in ('owner_to_renter','renter_to_owner_and_car')`
- check `reviewee_type in ('owner','renter')`

### New table: `review_scores`

Stores detailed scores by category.

Fields:

- `id UUID PK`
- `review_id UUID NOT NULL`
- `category_code VARCHAR(50) NOT NULL`
- `score SMALLINT NOT NULL`
- `created_at TIMESTAMP NOT NULL`

Constraints:

- unique `(review_id, category_code)`
- check `score between 1 and 5`

Allowed category codes:

- car categories:
  - `cleanliness`
  - `technical_condition`
  - `accuracy_of_description`
- owner categories:
  - `communication`
  - `honesty`
  - `response_speed`
- renter categories:
  - `returned_on_time`
  - `damage_free_return`
  - `behavior`

### Optional table: `review_flags`

For moderation and fraud review.

Fields:

- `id UUID PK`
- `review_id UUID NOT NULL`
- `reason_code VARCHAR(50) NOT NULL`
- `status VARCHAR(20) NOT NULL DEFAULT 'open'`
- `created_at TIMESTAMP NOT NULL`
- `resolved_at TIMESTAMP NULL`

## User Service Schema Changes

Replace the mental model of `user_ratings` from source-of-truth to aggregate snapshot only.

### Keep and extend `user_ratings`

Existing fields:

- `userId`
- `rating`
- `reviewsCount`
- `asRenterRating`
- `asRenterCount`
- `asOwnerRating`
- `asOwnerCount`

Add:

- `ownerCommunicationAvg DECIMAL(3,2) DEFAULT 0`
- `ownerHonestyAvg DECIMAL(3,2) DEFAULT 0`
- `ownerResponseSpeedAvg DECIMAL(3,2) DEFAULT 0`
- `renterReturnedOnTimeAvg DECIMAL(3,2) DEFAULT 0`
- `renterDamageFreeReturnAvg DECIMAL(3,2) DEFAULT 0`
- `renterBehaviorAvg DECIMAL(3,2) DEFAULT 0`
- `completedRentalsCount INT DEFAULT 0`

## Car Service Schema Changes

### Add table: `car_ratings`

Fields:

- `car_id UUID PK`
- `rating DECIMAL(3,2) DEFAULT 0`
- `reviews_count INT DEFAULT 0`
- `cleanliness_avg DECIMAL(3,2) DEFAULT 0`
- `technical_condition_avg DECIMAL(3,2) DEFAULT 0`
- `accuracy_of_description_avg DECIMAL(3,2) DEFAULT 0`
- `completed_rentals_count INT DEFAULT 0`
- `updated_at TIMESTAMP NOT NULL`

## Availability Model Upgrade

Current model:

- `car_availability` with unique `(car_id, date)`

This is too coarse for booking time slots.

### Recommended new table: `car_blocked_slots`

Fields:

- `id UUID PK`
- `car_id UUID NOT NULL`
- `start_at TIMESTAMP NOT NULL`
- `end_at TIMESTAMP NOT NULL`
- `source_type VARCHAR(30) NOT NULL`
- `source_id UUID NULL`
- `status VARCHAR(20) NOT NULL DEFAULT 'active'`
- `blocked_reason TEXT NULL`
- `created_at TIMESTAMP NOT NULL`

Allowed `source_type`:

- `booking`
- `owner_block`
- `maintenance`

Use:

- availability search becomes interval overlap check
- booking blocks exact pickup and return windows

## Entity Relationships

- one `rental` has up to two `reviews`
- one `review` has many `review_scores`
- one renter-submitted review updates:
  - car aggregate
  - owner aggregate
- one owner-submitted review updates:
  - renter aggregate

## API Design

Expose all review APIs through `api-gateway` under `/api/reviews/*`.

## Review Endpoints

### Eligibility and status

`GET /api/reviews/eligible`

Returns completed rentals the current user can still review.

Response:

```json
{
  "status": "success",
  "data": [
    {
      "bookingId": "uuid",
      "carId": "uuid",
      "ownerUserId": "uuid",
      "renterUserId": "uuid",
      "role": "renter",
      "reviewStatus": "waiting",
      "reviewWindowClosesAt": "2026-04-30T12:00:00.000Z"
    }
  ]
}
```

`GET /api/reviews/booking/:bookingId/status`

Returns:

- `canSubmit`
- `myReviewSubmitted`
- `counterpartyReviewSubmitted`
- `published`
- `expired`

### Submit review

`POST /api/reviews`

For renter reviewing owner and car:

```json
{
  "bookingId": "uuid",
  "comment": "Car was clean and exactly as described.",
  "scores": {
    "cleanliness": 5,
    "technical_condition": 4,
    "accuracy_of_description": 5,
    "communication": 5,
    "honesty": 5,
    "response_speed": 4
  }
}
```

For owner reviewing renter:

```json
{
  "bookingId": "uuid",
  "comment": "Returned on time and took care of the car.",
  "scores": {
    "returned_on_time": 5,
    "damage_free_return": 5,
    "behavior": 5
  }
}
```

Rules:

- authenticated user only
- exactly one review per booking per side
- only completed bookings
- only participants can submit

### Public reads

`GET /api/reviews/cars/:carId`

Returns published reviews about the car.

`GET /api/reviews/users/:userId?role=owner`

Returns published reviews about the user as an owner.

`GET /api/reviews/users/:userId?role=renter`

Returns published reviews about the user as a renter.

## Rating Aggregate Endpoints

### User service

`GET /api/users/:id/rating`

Extend current response to include detailed category averages.

### Car service

Add:

`GET /api/cars/:id/rating`

Response:

```json
{
  "status": "success",
  "data": {
    "carId": "uuid",
    "rating": 4.84,
    "reviewsCount": 37,
    "cleanlinessAvg": 4.9,
    "technicalConditionAvg": 4.7,
    "accuracyOfDescriptionAvg": 4.9,
    "completedRentalsCount": 58
  }
}
```

## Analytics Endpoints

Add or extend in `reporting-service`:

- `GET /api/analytics/reviews/overview`
- `GET /api/analytics/reviews/trends`
- `GET /api/analytics/reviews/distribution`
- `GET /api/analytics/reputation/top-cars`
- `GET /api/analytics/reputation/top-owners`
- `GET /api/analytics/reputation/risky-renters`

## Business Logic

## Booking Flow

1. Renter creates booking
2. `rental-service` validates:
   - car exists
   - renter exists
   - no overlapping booking
3. `ownerUserId` is copied from car snapshot into rental
4. booking blocks slot in `car-service`
5. when booking completes:
   - rental status becomes `completed`
   - `reviewStatus` becomes `waiting`
   - `reviewWindowClosesAt` is set, for example `completion + 14 days`

## Review Flow

### Renter side

After completed rental, renter submits one review containing:

- car scores
- owner scores
- optional comment

### Owner side

After completed rental, owner submits one review containing:

- renter scores
- optional comment

### Mutual publication rule

Required behavior:

- review stays hidden after first submission
- only when both sides have submitted, both reviews become published

Recommended implementation:

1. create review row inside DB transaction
2. check if counterparty review already exists
3. if no:
   - keep current review as `submitted`
   - update rental `reviewStatus = 'partial'`
4. if yes:
   - mark both rows `published`
   - stamp `publishedAt`
   - update rental `reviewStatus = 'published'`
   - emit review publication events

### Expiration behavior

Recommended first release:

- if second party never reviews before deadline, first review remains unpublished and expires

Alternative product option:

- publish first review automatically after deadline

For Airbnb-like fairness, the first option is closer to strict mutual reviews.

## Rating Calculation

Use published reviews only.

### Car overall rating

Average of:

- cleanliness
- technical condition
- accuracy of description

### Owner overall rating

Average of:

- communication
- honesty
- response speed

### Renter overall rating

Average of:

- returned on time
- damage free return
- behavior

### Aggregate update strategy

Preferred:

- update via event-driven consumers when a review becomes published

Fallback:

- update inside same transactional flow if events are not ready

Formula:

```text
new_avg = ((old_avg * old_count) + new_score) / (old_count + 1)
```

## Rental Count Tracking

Increment only on `completed` rentals.

### Per user

- renter count increments for renter
- owner count increments for owner

### Per car

- car completed rental count increments once booking is completed

Do not increment on booking creation.

## Security and Fraud Prevention

## Access control

- only authenticated participants can review
- user cannot review own booking from both sides
- one review per side per booking
- reviews cannot be submitted before completion

## Verification

Strongly recommended:

- require verified identity for renters
- require verified owner and car documents for listings
- keep immutable reviewer identity in stored review record

## Fraud signals

Add flags for:

- repeated reciprocal 5-star reviews between same accounts
- excessive reviews from same IP/device cluster
- abnormal volume spikes
- suspicious owner-created renter accounts

## Moderation tools

Add admin capability later for:

- hide review
- flag review
- investigate abuse

## Performance and Scalability

## Read optimization

- store public aggregates in `user-service` and `car-service`
- keep raw review queries paginated
- cache public aggregate responses if needed

## Database indexing

Add indexes:

- `reviews(booking_id)`
- `reviews(reviewee_user_id, status)`
- `reviews(car_id, status)`
- `review_scores(review_id, category_code)`
- `rentals(renter_user_id, status)`
- `rentals(owner_user_id, status)`
- `rentals(car_id, status, start_date, expected_end_date)`
- `car_blocked_slots(car_id, start_at, end_at, status)`

## Event-driven integration

Recommended events:

- `rental.completed`
- `review.submitted`
- `review.published`
- `rating.user.updated`
- `rating.car.updated`

Consumers:

- `user-service` listens to `review.published`
- `car-service` listens to `review.published`
- `reporting-service` listens to `review.published` and `rental.completed`

## Implementation Plan

## Phase 1: Schema and entities

### `rental-service`

- extend `Rental.entity.ts`
- add `Review.entity.ts`
- add `ReviewScore.entity.ts`
- add repository classes
- add migration or init SQL

### `car-service`

- add `CarRating.entity.ts`
- add repository/service/controller route

### `user-service`

- extend `UserRating.entity.ts`
- extend repository update methods for category averages

## Phase 2: Review workflow

### `rental-service`

- add `POST /api/rentals/reviews`
- add `GET /api/rentals/reviews/eligible`
- add `GET /api/rentals/reviews/booking/:id/status`
- implement validation and mutual publication logic

## Phase 3: Aggregate propagation

- publish `review.published`
- update user aggregates
- update car aggregates
- update rental review status

## Phase 4: Public display

### frontend / gateway

- show car rating summary on listing cards and detail page
- show owner reputation summary
- show renter reputation summary where needed for owners
- add booking history review CTA
- add hidden-until-both-reviewed messaging

## Phase 5: Analytics dashboard

### `reporting-service`

- add review KPI endpoints
- aggregate daily metrics
- expose leaderboard and reputation risk data

## Useful Dashboard Metrics

- completed rentals
- bookings awaiting review
- review submission rate
- mutual review completion rate
- average car rating
- average owner rating
- average renter rating
- top-rated cars
- top-rated owners
- low-rated renters
- late return rate
- damage incident rate
- rentals per city
- fleet utilization by car

## Concrete Codebase Changes

## Files likely to change

### `services/rental-service`

- `src/entities/Rental.entity.ts`
- `src/entities/Review.entity.ts`
- `src/entities/ReviewScore.entity.ts`
- `src/repositories/ReviewRepository.ts`
- `src/repositories/ReviewScoreRepository.ts`
- `src/services/RentalService.ts`
- `src/controllers/RentalController.ts`
- `src/routes/rental.routes.ts`
- `src/database/data-source.ts`

### `services/user-service`

- `src/entities/UserRating.entity.ts`
- `src/repositories/UserRatingRepository.ts`
- `src/controllers/UserController.ts`
- `src/services/UserService.ts`

### `services/car-service`

- `src/entities/CarRating.entity.ts`
- `src/repositories/CarRatingRepository.ts`
- `src/services/CarService.ts`
- `src/controllers/CarController.ts`
- `src/routes/car.routes.ts`
- `src/database/data-source.ts`

### `services/api-gateway`

- gateway routes for review endpoints

### `services/reporting-service`

- analytics routes and read models for review KPIs

## Recommended First Build Scope

To keep delivery manageable, implement this minimum slice first:

1. completed rental becomes review-eligible
2. renter can review owner + car
3. owner can review renter
4. both reviews stay hidden until both are submitted
5. user and car aggregates update on publication
6. booking history shows review status

Defer these to second iteration:

- moderation UI
- fraud scoring automation
- automatic expiration publishing variant
- advanced analytics charts
- full slot-rule engine for recurring owner availability

## Product Decisions To Confirm

These are the few decisions that affect behavior:

1. review window length
   - recommendation: 14 days
2. if only one side reviews and deadline passes:
   - recommendation: expire without publication
3. whether reviews can be edited before counterpart submits
   - recommendation: yes
4. whether owners can see renter rating before accepting instant/manual bookings
   - recommendation: yes, aggregate only

## Final Recommendation

For this repository, the cleanest implementation is:

- raw review workflow in `rental-service`
- user aggregate ratings in `user-service`
- car aggregate ratings in `car-service`
- analytics in `reporting-service`

This keeps review authorization close to rentals, while preserving fast public reads and avoiding cross-service transactional complexity on every page load.
