import { Rental } from '../entities/Rental.entity';
import { RentalStatus } from '../entities/Rental.entity';
import { RentalReviewStatus } from '../entities/Rental.entity';
import { RentalRepository } from '../repositories/RentalRepository';
import { RentalMessageRepository } from '../repositories/RentalMessageRepository';
import { CarInquiryMessageRepository } from '../repositories/CarInquiryMessageRepository';
import { ChatReadCursorRepository } from '../repositories/ChatReadCursorRepository';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { ReviewScoreRepository } from '../repositories/ReviewScoreRepository';
import { CarInfo, CarServiceClient } from './CarServiceClient';
import { UserInfo, UserServiceClient } from './UserServiceClient';
import { Review, ReviewStatus, ReviewType, RevieweeType } from '../entities/Review.entity';
import { sendEvent } from '../kafka/producer';
import { broadcastChatTopic, broadcastToUser } from '../ws/chatWebSocket';
import logger from '../utils/logger';

export class RentalService {
  private rentalRepository: RentalRepository;
  private rentalMessageRepository: RentalMessageRepository;
  private carInquiryMessageRepository: CarInquiryMessageRepository;
  private chatReadCursorRepository: ChatReadCursorRepository;
  private reviewRepository: ReviewRepository;
  private reviewScoreRepository: ReviewScoreRepository;
  private carServiceClient: CarServiceClient;
  private userServiceClient: UserServiceClient;

  constructor() {
    this.rentalRepository = new RentalRepository();
    this.rentalMessageRepository = new RentalMessageRepository();
    this.carInquiryMessageRepository = new CarInquiryMessageRepository();
    this.chatReadCursorRepository = new ChatReadCursorRepository();
    this.reviewRepository = new ReviewRepository();
    this.reviewScoreRepository = new ReviewScoreRepository();
    this.carServiceClient = new CarServiceClient();
    this.userServiceClient = new UserServiceClient();
  }

  private static readonly OWNER_REVIEW_CATEGORIES = [
    'returned_on_time',
    'damage_free_return',
    'behavior',
  ] as const;

  private static readonly RENTER_OWNER_CATEGORIES = [
    'communication',
    'honesty',
    'response_speed',
  ] as const;

  private static readonly RENTER_CAR_CATEGORIES = [
    'cleanliness',
    'technical_condition',
    'accuracy_of_description',
  ] as const;

  private static inquiryKey(carId: string, threadRenterUserId: string): string {
    return `inq:${carId}:${threadRenterUserId}`;
  }

  private static rentalKey(rentalId: string): string {
    return `rnt:${rentalId}`;
  }

  private async promotePendingRentals(): Promise<void> {
    const maybePromote = (this.rentalRepository as RentalRepository & {
      promoteDuePendingRentals?: () => Promise<void>;
    }).promoteDuePendingRentals;
    if (typeof maybePromote === 'function') {
      await maybePromote.call(this.rentalRepository);
    }
  }

  private isOngoingBookingStatus(s: RentalStatus): boolean {
    return s === RentalStatus.ACTIVE || s === RentalStatus.PENDING;
  }

  private normalizeDateToStartOfDay(d: Date): Date {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private doOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  /** Plain JSON shape for API; includes optional `car` from car-service for UI labels. */
  private rentalToJson(r: Rental): Record<string, unknown> {
    return {
      id: r.id,
      carId: r.carId,
      renterUserId: r.renterUserId,
      startDate: r.startDate,
      expectedEndDate: r.expectedEndDate,
      actualEndDate: r.actualEndDate,
      depositAmount: r.depositAmount,
      totalCost: r.totalCost,
      penaltyAmount: r.penaltyAmount,
      status: r.status,
      ownerUserId: r.ownerUserId,
      reviewStatus: r.reviewStatus,
      reviewWindowClosesAt: r.reviewWindowClosesAt,
      ownerReviewSubmittedAt: r.ownerReviewSubmittedAt,
      renterReviewSubmittedAt: r.renterReviewSubmittedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      penalties: r.penalties,
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private normalizeReviewStatus(rental: Rental): RentalReviewStatus {
    if (rental.status !== RentalStatus.COMPLETED) {
      return RentalReviewStatus.NOT_AVAILABLE;
    }
    if (rental.reviewStatus === RentalReviewStatus.PUBLISHED) {
      return RentalReviewStatus.PUBLISHED;
    }
    if (rental.reviewWindowClosesAt && rental.reviewWindowClosesAt < new Date()) {
      return RentalReviewStatus.EXPIRED;
    }
    if (rental.ownerReviewSubmittedAt || rental.renterReviewSubmittedAt) {
      return RentalReviewStatus.PARTIAL;
    }
    return RentalReviewStatus.WAITING;
  }

  private resolveReviewStatus(rental: Rental, reviews: Review[] = []): RentalReviewStatus {
    if (rental.status !== RentalStatus.COMPLETED) {
      return RentalReviewStatus.NOT_AVAILABLE;
    }

    if (reviews.some((review) => review.status === ReviewStatus.PUBLISHED)) {
      return RentalReviewStatus.PUBLISHED;
    }

    if (rental.reviewWindowClosesAt && rental.reviewWindowClosesAt < new Date()) {
      return RentalReviewStatus.EXPIRED;
    }

    if (reviews.length > 0 || rental.ownerReviewSubmittedAt || rental.renterReviewSubmittedAt) {
      return RentalReviewStatus.PARTIAL;
    }

    return this.normalizeReviewStatus(rental);
  }

  private async ensureOwnerUserId(rental: Rental): Promise<string | null> {
    if (rental.ownerUserId) {
      return rental.ownerUserId;
    }

    const car = await this.carServiceClient.getCarById(rental.carId);
    const ownerUserId = car?.ownerId ?? null;
    if (!ownerUserId) {
      return null;
    }

    await this.rentalRepository.update(rental.id, { ownerUserId });
    rental.ownerUserId = ownerUserId;
    return ownerUserId;
  }

  private assertValidScores(scores: Record<string, unknown>, allowedKeys: readonly string[]): Record<string, number> {
    const normalized: Record<string, number> = {};
    for (const key of allowedKeys) {
      const numeric = Number(scores?.[key]);
      if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
        throw Object.assign(new Error(`Invalid score for ${key}`), { statusCode: 400 });
      }
      normalized[key] = numeric;
    }
    return normalized;
  }

  private reviewToJson(review: Review): Record<string, unknown> {
    return {
      id: review.id,
      bookingId: review.bookingId,
      reviewerUserId: review.reviewerUserId,
      revieweeUserId: review.revieweeUserId,
      carId: review.carId,
      reviewType: review.reviewType,
      revieweeType: review.revieweeType,
      status: review.status,
      comment: review.comment,
      submittedAt: review.submittedAt,
      publishedAt: review.publishedAt,
      scores: review.scores?.reduce<Record<string, number>>((acc, item) => {
        acc[item.categoryCode] = Number(item.score);
        return acc;
      }, {}) || {},
    };
  }

  private async publishReviewAndPropagate(review: Review): Promise<void> {
    if (review.reviewType === ReviewType.RENTER_TO_OWNER_AND_CAR) {
      const allScores = review.scores.reduce<Record<string, number>>((acc, score) => {
        acc[score.categoryCode] = Number(score.score);
        return acc;
      }, {});
      const ownerCategories = RentalService.RENTER_OWNER_CATEGORIES.reduce<Record<string, number>>((acc, key) => {
        acc[key] = allScores[key];
        return acc;
      }, {});
      const carCategories = RentalService.RENTER_CAR_CATEGORIES.reduce<Record<string, number>>((acc, key) => {
        acc[key] = allScores[key];
        return acc;
      }, {});

      await this.userServiceClient.applyPublishedReviewAggregate(review.revieweeUserId, {
        role: 'owner',
        overallScore: this.average(Object.values(ownerCategories)),
        categories: ownerCategories,
      });
      await this.carServiceClient.applyPublishedReviewAggregate(review.carId, {
        overallScore: this.average(Object.values(carCategories)),
        categories: carCategories,
      });
    } else {
      const renterCategories = review.scores.reduce<Record<string, number>>((acc, score) => {
        acc[score.categoryCode] = Number(score.score);
        return acc;
      }, {});
      await this.userServiceClient.applyPublishedReviewAggregate(review.revieweeUserId, {
        role: 'renter',
        overallScore: this.average(Object.values(renterCategories)),
        categories: renterCategories,
      });
    }

    await sendEvent('review.published', {
      reviewId: review.id,
      bookingId: review.bookingId,
      reviewerUserId: review.reviewerUserId,
      revieweeUserId: review.revieweeUserId,
      reviewType: review.reviewType,
      publishedAt: review.publishedAt?.toISOString() || new Date().toISOString(),
    });
  }

  private carSummary(info: CarInfo) {
    return {
      id: info.id,
      make: info.make,
      model: info.model,
      brand: info.make,
    };
  }

  private userSummary(info: UserInfo) {
    const p = info.profile;
    const fromProfile =
      p && (p.firstName || p.lastName)
        ? [p.firstName, p.lastName].filter(Boolean).join(' ').trim()
        : '';
    const fullName =
      (info.fullName && String(info.fullName).trim()) ||
      fromProfile ||
      (info.username && String(info.username).trim()) ||
      info.email;
    return {
      id: info.id,
      email: info.email,
      fullName,
    };
  }

  /** Batch-load car and renter info for all rentals. */
  private async withCarSummaries(rentals: Rental[]): Promise<Record<string, unknown>[]> {
    const uniqueCarIds = [...new Set(rentals.map((r) => r.carId))];
    const uniqueUserIds = [...new Set(rentals.map((r) => r.renterUserId))];

    const [carPairs, userPairs] = await Promise.all([
      Promise.all(uniqueCarIds.map(async (id) => [id, await this.carServiceClient.getCarById(id)] as const)),
      Promise.all(uniqueUserIds.map(async (id) => [id, await this.userServiceClient.getUserById(id).catch(() => null)] as const)),
    ]);

    const carById = new Map<string, CarInfo | null>(carPairs);
    const userById = new Map<string, UserInfo | null>(userPairs);

    return rentals.map((r) => {
      const row = this.rentalToJson(r);
      const carInfo = carById.get(r.carId);
      if (carInfo) row.car = this.carSummary(carInfo);
      const userInfo = userById.get(r.renterUserId);
      if (userInfo) row.renter = this.userSummary(userInfo);
      return row;
    });
  }

  async createRental(
    carId: string,
    renterUserId: string,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    const start = new Date(startDate);
    const end = new Date(expectedEndDate);

    if (start > end) {
      const err: Error & { statusCode?: number } = new Error('Start date must be on or before expected end date');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (this.normalizeDateToStartOfDay(start) < this.normalizeDateToStartOfDay(now)) {
      const err: Error & { statusCode?: number } = new Error('Start date cannot be in the past');
      err.statusCode = 400;
      throw err;
    }

    const carForRental = await this.carServiceClient.getCarForRental(carId);
    if (!carForRental) {
      const error: any = new Error(
        'Car not found or not available for rental (maintenance/deleted or invalid pricing)'
      );
      error.statusCode = 400;
      throw error;
    }

    const userExists = await this.userServiceClient.validateRenter(renterUserId);
    if (!userExists) {
      const error: any = new Error('Renter user not found');
      error.statusCode = 400;
      throw error;
    }

    await this.promotePendingRentals();

    const existingRentals = await this.rentalRepository.findByCarId(carId);
    const hasOverlap = existingRentals.some((r) => {
      if (r.status === RentalStatus.COMPLETED || r.status === RentalStatus.CANCELLED) {
        const rentalEnd = new Date(r.actualEndDate || r.expectedEndDate);
        if (rentalEnd < now) return false;
      } else if (!this.isOngoingBookingStatus(r.status)) return false;

      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.actualEndDate || r.expectedEndDate);
      return this.doOverlap(start, end, rStart, rEnd);
    });

    if (hasOverlap) {
      const error: any = new Error('Car is already booked for the selected dates');
      error.statusCode = 400;
      throw error;
    }

    const days = this.daysBetween(start, end);
    const totalCost = Number((carForRental.dailyRate * days).toFixed(2));
    const depositAmount = carForRental.depositAmount;

    const startDay = this.normalizeDateToStartOfDay(start);
    const today = this.normalizeDateToStartOfDay(now);
    const isInstantBook = Boolean(carForRental.car.instantBook);
    const bookingStatus = isInstantBook
      ? startDay.getTime() > today.getTime()
        ? RentalStatus.PENDING
        : RentalStatus.ACTIVE
      : RentalStatus.PENDING;

    const rental = await this.rentalRepository.create({
      carId,
      renterUserId,
      ownerUserId: carForRental.car.ownerId,
      startDate: start,
      expectedEndDate: end,
      depositAmount,
      totalCost,
      penaltyAmount: 0,
      status: bookingStatus,
      reviewStatus: RentalReviewStatus.NOT_AVAILABLE,
      reviewWindowClosesAt: null,
      ownerReviewSubmittedAt: null,
      renterReviewSubmittedAt: null,
    });

    if (isInstantBook && bookingStatus === RentalStatus.ACTIVE) {
      await this.carServiceClient.updateCarStatus(carId, 'rented');
    }
    await sendEvent('rental.created', {
      rentalId: rental.id,
      carId,
      renterId: renterUserId,
      ownerId: carForRental.car.ownerId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalCost,
      status: bookingStatus,
      bookingMode: isInstantBook ? 'instant' : 'manual',
    });

    logger.info('Rental created', { rentalId: rental.id, carId, renterUserId });
    const [withCar] = await this.withCarSummaries([rental]);
    return withCar as unknown as Rental;
  }

  async approveRentalByOwner(rentalId: string, ownerUserId: string): Promise<Rental> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }
    if (rental.status !== RentalStatus.PENDING) {
      throw Object.assign(new Error('Only pending rentals can be approved'), { statusCode: 409 });
    }

    const car = await this.carServiceClient.getCarById(rental.carId);
    if (!car || String(car.ownerId).toLowerCase() !== String(ownerUserId).toLowerCase()) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const status =
      this.normalizeDateToStartOfDay(rental.startDate).getTime() >
      this.normalizeDateToStartOfDay(new Date()).getTime()
        ? RentalStatus.PENDING
        : RentalStatus.ACTIVE;
    const updated = await this.rentalRepository.update(rentalId, { status });
    if (status === RentalStatus.ACTIVE) {
      await this.carServiceClient.updateCarStatus(rental.carId, 'rented');
    }
    const [withCar] = await this.withCarSummaries([updated]);
    return withCar as unknown as Rental;
  }

  async rejectRentalByOwner(rentalId: string, ownerUserId: string): Promise<Rental> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }
    if (rental.status !== RentalStatus.PENDING) {
      throw Object.assign(new Error('Only pending rentals can be rejected'), { statusCode: 409 });
    }

    const car = await this.carServiceClient.getCarById(rental.carId);
    if (!car || String(car.ownerId).toLowerCase() !== String(ownerUserId).toLowerCase()) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const updated = await this.rentalRepository.update(rentalId, {
      status: RentalStatus.CANCELLED,
      actualEndDate: new Date(),
      totalCost: 0,
      penaltyAmount: 0,
    });
    const [withCar] = await this.withCarSummaries([updated]);
    return withCar as unknown as Rental;
  }

  async completeRental(rentalId: string, actualEndDate?: Date): Promise<Rental> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.status === RentalStatus.PENDING) {
      throw new Error('Rental has not started yet; cannot complete');
    }
    if (rental.status !== RentalStatus.ACTIVE) throw new Error('Rental is not active');

    const endDate = actualEndDate || new Date();
    const startOnly = this.normalizeDateToStartOfDay(rental.startDate);
    const endOnly = this.normalizeDateToStartOfDay(endDate);
    if (endOnly < startOnly) throw new Error('Actual end date cannot be before start date');

    const carForRental = await this.carServiceClient.getCarForRental(rental.carId);
    const dailyRate = carForRental?.dailyRate ?? 0;

    const actualDays = this.daysBetween(rental.startDate, endDate);
    let actualTotalCost = Number((dailyRate * actualDays).toFixed(2));
    let penaltyAmount = 0;

    if (endDate > rental.expectedEndDate) {
      const daysLate = this.daysBetween(rental.expectedEndDate, endDate);
      penaltyAmount = Number((dailyRate * daysLate * 0.5).toFixed(2));
    }

    await this.rentalRepository.update(rentalId, {
      status: RentalStatus.COMPLETED,
      actualEndDate: endDate,
      totalCost: actualTotalCost,
      penaltyAmount,
      reviewStatus: RentalReviewStatus.WAITING,
      reviewWindowClosesAt: new Date(endDate.getTime() + 14 * 24 * 60 * 60 * 1000),
    });

    const countUpdates: Promise<unknown>[] = [];
    if (typeof this.userServiceClient.incrementCompletedRentals === 'function') {
      countUpdates.push(this.userServiceClient.incrementCompletedRentals(rental.renterUserId));
      if (rental.ownerUserId) {
        countUpdates.push(this.userServiceClient.incrementCompletedRentals(rental.ownerUserId));
      }
    }
    if (typeof this.carServiceClient.incrementCompletedRentals === 'function') {
      countUpdates.push(this.carServiceClient.incrementCompletedRentals(rental.carId));
    }
    if (countUpdates.length > 0) {
      await Promise.allSettled(countUpdates);
    }

    const otherActive = (await this.rentalRepository.findByCarId(rental.carId)).filter(
      (r) => r.id !== rentalId && this.isOngoingBookingStatus(r.status)
    );
    if (otherActive.length === 0) {
      await this.carServiceClient.updateCarStatus(rental.carId, 'active');
    }

    await sendEvent('rental.completed', {
      rentalId,
      carId: rental.carId,
      finalCost: actualTotalCost + penaltyAmount,
      timestamp: new Date().toISOString(),
    });

    const updated = (await this.rentalRepository.findById(rentalId))!;
    const [withCar] = await this.withCarSummaries([updated]);
    return withCar as unknown as Rental;
  }

  async cancelRental(rentalId: string, cancellationDate?: Date): Promise<Rental> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (!this.isOngoingBookingStatus(rental.status)) throw new Error('Only pending or active rentals can be cancelled');

    const cancelDate = cancellationDate || new Date();

    if (cancelDate < rental.startDate) {
      await this.rentalRepository.update(rentalId, {
        status: RentalStatus.CANCELLED,
        actualEndDate: cancelDate,
        totalCost: 0,
        penaltyAmount: 0,
      });
    } else {
      const carForRental = await this.carServiceClient.getCarForRental(rental.carId);
      const dailyRate = carForRental?.dailyRate ?? 0;
      const actualDays = this.daysBetween(rental.startDate, cancelDate);
      const daysToCharge = Math.max(1, actualDays);
      const actualTotalCost = Number((dailyRate * daysToCharge).toFixed(2));
      let penaltyAmount = 0;
      if (cancelDate > rental.expectedEndDate) {
        const daysLate = this.daysBetween(rental.expectedEndDate, cancelDate);
        penaltyAmount = Number((dailyRate * daysLate * 0.5).toFixed(2));
      }
      await this.rentalRepository.update(rentalId, {
        status: RentalStatus.CANCELLED,
        actualEndDate: cancelDate,
        totalCost: actualTotalCost,
        penaltyAmount,
      });
    }

    const otherActive = (await this.rentalRepository.findByCarId(rental.carId)).filter(
      (r) => r.id !== rentalId && this.isOngoingBookingStatus(r.status)
    );
    if (otherActive.length === 0) {
      await this.carServiceClient.updateCarStatus(rental.carId, 'active');
    }

    await sendEvent('rental.cancelled', {
      rentalId,
      cancelledBy: rental.renterUserId,
      timestamp: new Date().toISOString(),
    });

    const updated = (await this.rentalRepository.findById(rentalId))!;
    const [withCar] = await this.withCarSummaries([updated]);
    return withCar as unknown as Rental;
  }

  async getRentalById(id: string): Promise<Rental | null> {
    await this.promotePendingRentals();
    const r = await this.rentalRepository.findById(id);
    if (!r) return null;
    const [withCar] = await this.withCarSummaries([r]);
    return withCar as unknown as Rental;
  }

  async getAllRentals(): Promise<Rental[]> {
    const rows = await this.rentalRepository.findAll();
    return (await this.withCarSummaries(rows)) as unknown as Rental[];
  }

  async getActiveRentals(): Promise<Rental[]> {
    const rows = await this.rentalRepository.findActive();
    return (await this.withCarSummaries(rows)) as unknown as Rental[];
  }

  async getRentalsByCarId(carId: string): Promise<Rental[]> {
    await this.promotePendingRentals();
    const rows = await this.rentalRepository.findByCarId(carId);
    return (await this.withCarSummaries(rows)) as unknown as Rental[];
  }

  async getRentalsByRenterId(renterUserId: string): Promise<Rental[]> {
    await this.promotePendingRentals();
    const rows = await this.rentalRepository.findByRenterId(renterUserId);
    return (await this.withCarSummaries(rows)) as unknown as Rental[];
  }

  async getRentalsForCurrentRenter(renterUserId: string): Promise<Rental[]> {
    return this.getRentalsByRenterId(renterUserId);
  }

  /** Усі бронювання по авто власника (для підтвердження заявок тощо). */
  async getRentalsForOwner(ownerUserId: string): Promise<Rental[]> {
    await this.promotePendingRentals();
    const rows = await this.rentalRepository.findByOwnerUserId(ownerUserId);
    return (await this.withCarSummaries(rows)) as unknown as Rental[];
  }

  async getBookedDates(carId: string): Promise<Array<{ startDate: Date; endDate: Date }>> {
    await this.promotePendingRentals();
    const rentals = await this.rentalRepository.findByCarId(carId);
    const now = new Date();
    return rentals
      .filter((r) => {
        if (this.isOngoingBookingStatus(r.status)) return true;
        if (r.status === RentalStatus.COMPLETED || r.status === RentalStatus.CANCELLED) {
          const end = new Date(r.actualEndDate || r.expectedEndDate);
          return end >= now;
        }
        return false;
      })
      .map((r) => ({ startDate: r.startDate, endDate: r.actualEndDate || r.expectedEndDate }));
  }

  async getLandlordContactForCar(
    carId: string,
    _renterUserId: string
  ): Promise<{ fullName: string; phone: string | null; email: string }> {
    await this.promotePendingRentals();
    const car = await this.carServiceClient.getCarById(carId);
    if (!car) {
      const err: Error & { statusCode?: number } = new Error('Car not found');
      err.statusCode = 404;
      throw err;
    }
    const owner = await this.userServiceClient.getUserById(car.ownerId);
    if (!owner) {
      const err: Error & { statusCode?: number } = new Error('Owner not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      fullName: this.userSummary(owner).fullName,
      phone: owner.phone || null,
      email: owner.email,
    };
  }

  /** Контакти орендаря в inquiry-треді — лише для власника авто, якщо є переписка з цим орендарем. */
  async getInquiryRenterContactForCarOwner(
    carId: string,
    renterUserId: string,
    ownerUserId: string
  ): Promise<{ fullName: string; phone: string | null; email: string | null }> {
    await this.promotePendingRentals();
    const car = await this.carServiceClient.getCarById(carId);
    if (!car?.ownerId) {
      const err: Error & { statusCode?: number } = new Error('Car not found');
      err.statusCode = 404;
      throw err;
    }
    if (String(car.ownerId).toLowerCase() !== String(ownerUserId).toLowerCase()) {
      const err: Error & { statusCode?: number } = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
    const threadMsgs = await this.carInquiryMessageRepository.findByThread(carId, renterUserId);
    if (threadMsgs.length === 0) {
      const err: Error & { statusCode?: number } = new Error('Немає діалогу з цим орендарем');
      err.statusCode = 404;
      throw err;
    }
    const renter = await this.userServiceClient.getUserById(renterUserId);
    if (!renter) {
      return {
        fullName: 'Орендар',
        phone: null,
        email: null,
      };
    }
    return {
      fullName: this.userSummary(renter).fullName,
      phone: renter.phone || null,
      email: renter.email || null,
    };
  }

  private async assertCanAccessRentalMessages(rental: Rental, userId: string): Promise<void> {
    const uid = String(userId).toLowerCase();
    if (String(rental.renterUserId).toLowerCase() === uid) return;
    const car = await this.carServiceClient.getCarById(rental.carId);
    if (car?.ownerId && String(car.ownerId).toLowerCase() === uid) return;
    const err: Error & { statusCode?: number } = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  async getRentalMessages(
    rentalId: string,
    userId: string
  ): Promise<Array<{ id: string; senderUserId: string; body: string; createdAt: string }>> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      const err: Error & { statusCode?: number } = new Error('Rental not found');
      err.statusCode = 404;
      throw err;
    }
    await this.assertCanAccessRentalMessages(rental, userId);
    const rows = await this.rentalMessageRepository.findByRentalId(rentalId);
    return rows.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async postRentalMessage(rentalId: string, userId: string, body: string): Promise<{ id: string }> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      const err: Error & { statusCode?: number } = new Error('Rental not found');
      err.statusCode = 404;
      throw err;
    }
    await this.assertCanAccessRentalMessages(rental, userId);
    const trimmed = (body || '').trim();
    if (!trimmed) {
      const err: Error & { statusCode?: number } = new Error('Порожнє повідомлення');
      err.statusCode = 400;
      throw err;
    }
    if (trimmed.length > 4000) {
      const err: Error & { statusCode?: number } = new Error('Повідомлення занадто довге');
      err.statusCode = 400;
      throw err;
    }
    const msg = await this.rentalMessageRepository.create({
      rentalId,
      senderUserId: userId,
      body: trimmed,
    });
    const topic = RentalService.rentalKey(rentalId);
    broadcastChatTopic(topic, {
      type: 'chat_message',
      kind: 'rental',
      rentalId,
      id: msg.id,
    });
    const carForOwner = await this.carServiceClient.getCarById(rental.carId);
    if (carForOwner?.ownerId) {
      broadcastToUser(String(carForOwner.ownerId), { type: 'unread_changed' });
    }
    broadcastToUser(String(rental.renterUserId), { type: 'unread_changed' });
    return { id: msg.id };
  }

  async createBookingForCurrentRenter(
    renterUserId: string,
    carId: string,
    startDate: Date,
    expectedEndDate: Date
  ): Promise<Rental> {
    return this.createRental(carId, renterUserId, startDate, expectedEndDate);
  }

  async getEligibleReviews(userId: string): Promise<Array<Record<string, unknown>>> {
    await this.promotePendingRentals();
    const rentals = await this.rentalRepository.findAll();
    const result: Array<Record<string, unknown>> = [];

    for (const rental of rentals) {
      if (rental.status !== RentalStatus.COMPLETED) {
        continue;
      }

      const ownerUserId = rental.ownerUserId || (await this.ensureOwnerUserId(rental));
      const isParticipant =
        rental.renterUserId === userId || (ownerUserId && ownerUserId === userId);

      if (!isParticipant) {
        continue;
      }

      const reviews = await this.reviewRepository.findByBookingId(rental.id);
      const status = this.resolveReviewStatus(rental, reviews);
      if (status !== RentalReviewStatus.WAITING && status !== RentalReviewStatus.PARTIAL) {
        continue;
      }
      const myReview = reviews.find((review) => review.reviewerUserId === userId);
      const counterpartyReview = reviews.find((review) => review.reviewerUserId !== userId);

      result.push({
        bookingId: rental.id,
        carId: rental.carId,
        ownerUserId,
        renterUserId: rental.renterUserId,
        role: rental.renterUserId === userId ? 'renter' : 'owner',
        reviewStatus: status,
        reviewWindowClosesAt: rental.reviewWindowClosesAt,
        myReviewSubmitted: Boolean(myReview),
        counterpartyReviewSubmitted: Boolean(counterpartyReview),
        canSubmit: !myReview,
        myReview: myReview ? this.reviewToJson(myReview) : null,
      });
    }

    return result;
  }

  async getReviewStatusForBooking(bookingId: string, userId: string): Promise<Record<string, unknown>> {
    const rental = await this.rentalRepository.findById(bookingId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }
    const ownerUserId = rental.ownerUserId || (await this.ensureOwnerUserId(rental));
    const isParticipant =
      rental.renterUserId === userId || (ownerUserId && ownerUserId === userId);
    if (!isParticipant) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    const reviews = await this.reviewRepository.findByBookingId(bookingId);
    const myReview = reviews.find((review) => review.reviewerUserId === userId);
    const counterpartyReview = reviews.find((review) => review.reviewerUserId !== userId);
    const status = this.resolveReviewStatus(rental, reviews);

    return {
      bookingId,
      canSubmit:
        rental.status === RentalStatus.COMPLETED &&
        !myReview &&
        status !== RentalReviewStatus.PUBLISHED &&
        status !== RentalReviewStatus.EXPIRED,
      myReviewSubmitted: Boolean(myReview),
      counterpartyReviewSubmitted: Boolean(counterpartyReview),
      published: status === RentalReviewStatus.PUBLISHED,
      expired: status === RentalReviewStatus.EXPIRED,
      reviewStatus: status,
      reviewWindowClosesAt: rental.reviewWindowClosesAt,
    };
  }

  async getMyReviewForBooking(bookingId: string, userId: string): Promise<Record<string, unknown> | null> {
    const rental = await this.rentalRepository.findById(bookingId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }

    const ownerUserId = rental.ownerUserId || (await this.ensureOwnerUserId(rental));
    const isParticipant =
      rental.renterUserId === userId || (ownerUserId && ownerUserId === userId);

    if (!isParticipant) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const review = await this.reviewRepository.findByBookingAndReviewer(bookingId, userId);
    return review ? this.reviewToJson(review) : null;
  }

  async submitReview(
    userId: string,
    bookingId: string,
    comment: string | null,
    rawScores: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(bookingId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }
    const ownerUserId = rental.ownerUserId || (await this.ensureOwnerUserId(rental));
    if (rental.status !== RentalStatus.COMPLETED) {
      throw Object.assign(new Error('Only completed rentals can be reviewed'), { statusCode: 400 });
    }
    if (rental.reviewWindowClosesAt && rental.reviewWindowClosesAt < new Date()) {
      await this.rentalRepository.update(bookingId, { reviewStatus: RentalReviewStatus.EXPIRED });
      throw Object.assign(new Error('Review window expired'), { statusCode: 400 });
    }

    const isRenter = rental.renterUserId === userId;
    const isOwner = ownerUserId === userId;
    if (!isRenter && !isOwner) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    if (isRenter && !ownerUserId) {
      throw Object.assign(new Error('Owner not found for rental'), { statusCode: 400 });
    }

    const existing = await this.reviewRepository.findByBookingAndReviewer(bookingId, userId);
    if (existing) {
      throw Object.assign(new Error('Review already submitted'), { statusCode: 409 });
    }

    const normalizedScores = isRenter
      ? {
          ...this.assertValidScores(rawScores, RentalService.RENTER_OWNER_CATEGORIES),
          ...this.assertValidScores(rawScores, RentalService.RENTER_CAR_CATEGORIES),
        }
      : this.assertValidScores(rawScores, RentalService.OWNER_REVIEW_CATEGORIES);

    const now = new Date();
    const review = await this.reviewRepository.create({
      bookingId,
      reviewerUserId: userId,
      revieweeUserId: isRenter ? ownerUserId! : rental.renterUserId,
      carId: rental.carId,
      reviewType: isRenter ? ReviewType.RENTER_TO_OWNER_AND_CAR : ReviewType.OWNER_TO_RENTER,
      revieweeType: isRenter ? RevieweeType.OWNER : RevieweeType.RENTER,
      status: ReviewStatus.SUBMITTED,
      comment: comment?.trim() || null,
      submittedAt: now,
      publishedAt: null,
    });

    await this.reviewScoreRepository.createMany(
      Object.entries(normalizedScores).map(([categoryCode, score]) => ({
        reviewId: review.id,
        categoryCode,
        score,
      }))
    );

    const reviewWithScores = await this.reviewRepository.findById(review.id);
    const bookingReviews = await this.reviewRepository.findByBookingId(bookingId);
    const counterpartyReview = bookingReviews.find((item) => item.reviewerUserId !== userId);

    if (isRenter) {
      await this.rentalRepository.update(bookingId, {
        renterReviewSubmittedAt: now,
        reviewStatus: counterpartyReview ? RentalReviewStatus.PUBLISHED : RentalReviewStatus.PARTIAL,
      });
    } else {
      await this.rentalRepository.update(bookingId, {
        ownerReviewSubmittedAt: now,
        reviewStatus: counterpartyReview ? RentalReviewStatus.PUBLISHED : RentalReviewStatus.PARTIAL,
      });
    }

    if (counterpartyReview && reviewWithScores) {
      const publishedAt = new Date();
      const currentReview = await this.reviewRepository.update(review.id, {
        status: ReviewStatus.PUBLISHED,
        publishedAt,
      });
      const otherReview = await this.reviewRepository.update(counterpartyReview.id, {
        status: ReviewStatus.PUBLISHED,
        publishedAt,
      });
      await this.publishReviewAndPropagate(currentReview);
      await this.publishReviewAndPropagate(otherReview);
      await this.rentalRepository.update(bookingId, {
        reviewStatus: RentalReviewStatus.PUBLISHED,
      });
      return {
        review: this.reviewToJson(currentReview),
        counterpartPublished: true,
        reviewStatus: RentalReviewStatus.PUBLISHED,
      };
    }

    return {
      review: this.reviewToJson(reviewWithScores || review),
      counterpartPublished: false,
      reviewStatus: RentalReviewStatus.PARTIAL,
    };
  }

  async updateReview(
    userId: string,
    bookingId: string,
    comment: string | null,
    rawScores: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    await this.promotePendingRentals();
    const rental = await this.rentalRepository.findById(bookingId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { statusCode: 404 });
    }

    const ownerUserId = rental.ownerUserId || (await this.ensureOwnerUserId(rental));
    const isRenter = rental.renterUserId === userId;
    const isOwner = ownerUserId === userId;

    if (!isRenter && !isOwner) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const review = await this.reviewRepository.findByBookingAndReviewer(bookingId, userId);
    if (!review) {
      throw Object.assign(new Error('Review not found'), { statusCode: 404 });
    }

    if (review.status !== ReviewStatus.SUBMITTED) {
      throw Object.assign(new Error('Published reviews cannot be edited'), { statusCode: 409 });
    }

    const bookingReviews = await this.reviewRepository.findByBookingId(bookingId);
    const counterpartyReview = bookingReviews.find((item) => item.reviewerUserId !== userId);
    if (counterpartyReview) {
      throw Object.assign(new Error('Review can no longer be edited'), { statusCode: 409 });
    }

    const normalizedScores = isRenter
      ? {
          ...this.assertValidScores(rawScores, RentalService.RENTER_OWNER_CATEGORIES),
          ...this.assertValidScores(rawScores, RentalService.RENTER_CAR_CATEGORIES),
        }
      : this.assertValidScores(rawScores, RentalService.OWNER_REVIEW_CATEGORIES);

    const submittedAt = new Date();
    const updatedReview = await this.reviewRepository.update(review.id, {
      comment: comment?.trim() || null,
      submittedAt,
    });

    await this.reviewScoreRepository.replaceForReview(
      review.id,
      Object.entries(normalizedScores).map(([categoryCode, score]) => ({
        reviewId: review.id,
        categoryCode,
        score,
      }))
    );

    const reviewWithScores = await this.reviewRepository.findById(review.id);
    return {
      review: this.reviewToJson(reviewWithScores || updatedReview),
      counterpartPublished: false,
      reviewStatus: this.resolveReviewStatus(rental, [reviewWithScores || updatedReview]),
    };
  }

  async getPublishedReviewsForCar(carId: string): Promise<Array<Record<string, unknown>>> {
    const reviews = await this.reviewRepository.findPublishedByCarId(carId);
    return reviews
      .filter((review) => review.reviewType === ReviewType.RENTER_TO_OWNER_AND_CAR)
      .map((review) => this.reviewToJson(review));
  }

  async getPublishedReviewsForUser(
    userId: string,
    role?: 'owner' | 'renter'
  ): Promise<Array<Record<string, unknown>>> {
    const reviews = await this.reviewRepository.findPublishedByReviewee(userId, role);
    return reviews.map((review) => this.reviewToJson(review));
  }

  /**
   * Усі inquiry-діалоги по авто власника — для хабу «Чати» (орендодавець бачить список без бронювань як орендар).
   */
  async getMyInquiryChatsAsOwner(userId: string): Promise<
    Array<{
      carId: string;
      carTitle: string;
      threadRenterUserId: string;
      lastMessageAt: string;
      preview: string;
    }>
  > {
    await this.promotePendingRentals();
    const uid = String(userId).toLowerCase();
    /** Не покладаємось на GET /cars/owner (мережа, парсинг, формат id) — лише авто, де вже є листи в нашій БД. */
    const candidateCarIds = await this.carInquiryMessageRepository.findDistinctCarIdsWithMessages();
    const out: Array<{
      carId: string;
      carTitle: string;
      threadRenterUserId: string;
      lastMessageAt: string;
      preview: string;
    }> = [];
    for (const carId of candidateCarIds) {
      const car = await this.carServiceClient.getCarById(carId);
      if (!car?.ownerId || String(car.ownerId).toLowerCase() !== uid) {
        continue;
      }
      const rows = await this.carInquiryMessageRepository.listLatestPerThread(carId);
      for (const m of rows) {
        const preview = m.body.length > 160 ? `${m.body.slice(0, 160)}…` : m.body;
        const carTitle =
          [car.make, car.model].filter(Boolean).join(' ').trim() || `Авто ${car.id.slice(0, 8)}…`;
        out.push({
          carId: car.id,
          carTitle,
          threadRenterUserId: m.threadRenterUserId,
          lastMessageAt: m.createdAt.toISOString(),
          preview,
        });
      }
    }
    out.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return out;
  }

  /** Список тредів (орендарів) з останнім повідомленням — лише для власника авто. */
  async getCarInquiryThreadsForOwner(
    carId: string,
    userId: string
  ): Promise<Array<{ threadRenterUserId: string; lastMessageAt: string; preview: string }>> {
    const car = await this.carServiceClient.getCarById(carId);
    if (!car?.ownerId) {
      const err: Error & { statusCode?: number } = new Error(
        'Авто не знайдено або car-service недоступний. Перевірте сервіс авто та змінні CAR_SERVICE_URL / GATEWAY_URL.'
      );
      err.statusCode = 404;
      throw err;
    }
    if (String(car.ownerId).toLowerCase() !== String(userId).toLowerCase()) {
      const err: Error & { statusCode?: number } = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
    const rows = await this.carInquiryMessageRepository.listLatestPerThread(carId);
    return rows.map((m) => ({
      threadRenterUserId: m.threadRenterUserId,
      lastMessageAt: m.createdAt.toISOString(),
      preview: m.body.length > 160 ? `${m.body.slice(0, 160)}…` : m.body,
    }));
  }

  /** Чат до/без бронювання: тред (carId + threadRenterUserId). */
  async getCarInquiryMessages(
    carId: string,
    userId: string,
    renterIdQuery?: string
  ): Promise<Array<{ id: string; senderUserId: string; body: string; createdAt: string }>> {
    const car = await this.carServiceClient.getCarById(carId);
    if (!car?.ownerId) {
      const err: Error & { statusCode?: number } = new Error(
        'Авто не знайдено або car-service недоступний. Перевірте сервіс авто та змінні CAR_SERVICE_URL / GATEWAY_URL.'
      );
      err.statusCode = 404;
      throw err;
    }
    let threadRenterId: string;
    if (car.ownerId === userId) {
      if (!renterIdQuery) {
        const err: Error & { statusCode?: number } = new Error('Параметр renterId обов’язковий для власника');
        err.statusCode = 400;
        throw err;
      }
      threadRenterId = renterIdQuery;
    } else {
      const ok = await this.userServiceClient.validateRenter(userId);
      if (!ok) {
        const err: Error & { statusCode?: number } = new Error('Forbidden');
        err.statusCode = 403;
        throw err;
      }
      threadRenterId = userId;
    }
    const rows = await this.carInquiryMessageRepository.findByThread(carId, threadRenterId);
    return rows.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async postCarInquiryMessage(
    carId: string,
    userId: string,
    body: string,
    threadRenterUserIdForOwner?: string
  ): Promise<{ id: string }> {
    const car = await this.carServiceClient.getCarById(carId);
    if (!car?.ownerId) {
      const err: Error & { statusCode?: number } = new Error(
        'Авто не знайдено або car-service недоступний. Перевірте сервіс авто та змінні CAR_SERVICE_URL / GATEWAY_URL.'
      );
      err.statusCode = 404;
      throw err;
    }
    let threadRenterId: string;
    if (car.ownerId === userId) {
      if (!threadRenterUserIdForOwner) {
        const err: Error & { statusCode?: number } = new Error(
          'Для відповіді вкажіть threadRenterUserId (орендар треду)'
        );
        err.statusCode = 400;
        throw err;
      }
      threadRenterId = threadRenterUserIdForOwner;
    } else {
      const ok = await this.userServiceClient.validateRenter(userId);
      if (!ok) {
        const err: Error & { statusCode?: number } = new Error('Forbidden');
        err.statusCode = 403;
        throw err;
      }
      threadRenterId = userId;
    }
    const trimmed = (body || '').trim();
    if (!trimmed) {
      const err: Error & { statusCode?: number } = new Error('Порожнє повідомлення');
      err.statusCode = 400;
      throw err;
    }
    if (trimmed.length > 4000) {
      const err: Error & { statusCode?: number } = new Error('Повідомлення занадто довге');
      err.statusCode = 400;
      throw err;
    }
    const msg = await this.carInquiryMessageRepository.create({
      carId,
      threadRenterUserId: threadRenterId,
      senderUserId: userId,
      body: trimmed,
    });
    const topic = RentalService.inquiryKey(carId, threadRenterId);
    broadcastChatTopic(topic, {
      type: 'chat_message',
      kind: 'inquiry',
      carId,
      threadRenterUserId: threadRenterId,
      id: msg.id,
    });
    if (car.ownerId) {
      broadcastToUser(String(car.ownerId), { type: 'unread_changed' });
    }
    broadcastToUser(String(threadRenterId), { type: 'unread_changed' });
    return { id: msg.id };
  }

  /** Непрочитані (від іншої сторони після last_read_at) для сайдбару та хабу чатів. */
  async getUnreadChatsSummary(userId: string): Promise<{
    total: number;
    items: Array<{ key: string; unread: number }>;
  }> {
    await this.promotePendingRentals();
    const uid = String(userId).toLowerCase();
    const cursors = await this.chatReadCursorRepository.findByUserId(uid);
    const cursorMap = new Map(cursors.map((c) => [c.conversationKey, c.lastReadAt]));
    const after = (key: string) => cursorMap.get(key) ?? new Date(0);

    const unreadByKey = new Map<string, number>();
    const bump = (key: string, n: number) => {
      if (n <= 0) return;
      const prev = unreadByKey.get(key) ?? 0;
      unreadByKey.set(key, prev + n);
    };

    for (const row of await this.getMyInquiryChatsAsOwner(uid)) {
      const key = RentalService.inquiryKey(row.carId, row.threadRenterUserId);
      const n = await this.carInquiryMessageRepository.countIncomingAfter(
        row.carId,
        row.threadRenterUserId,
        uid,
        after(key)
      );
      bump(key, n);
    }

    const renterMsgCars = await this.carInquiryMessageRepository.findDistinctCarIdsForRenterThread(uid);
    const renterRentals = await this.rentalRepository.findByRenterId(uid);
    const renterCarIds = new Set<string>([
      ...renterMsgCars,
      ...renterRentals.filter((r) => r.status !== RentalStatus.CANCELLED).map((r) => r.carId),
    ]);
    for (const carId of renterCarIds) {
      const key = RentalService.inquiryKey(carId, uid);
      const n = await this.carInquiryMessageRepository.countIncomingAfter(carId, uid, uid, after(key));
      bump(key, n);
    }

    for (const r of renterRentals) {
      if (r.status === RentalStatus.CANCELLED) continue;
      const key = RentalService.rentalKey(r.id);
      const n = await this.rentalMessageRepository.countIncomingAfter(r.id, uid, after(key));
      bump(key, n);
    }

    const cars = await this.carServiceClient.getCarsByOwner(uid);
    if (cars.length > 0) {
      const ownerRentals = await this.rentalRepository.findByCarIds(cars.map((c) => c.id));
      for (const r of ownerRentals) {
        if (r.status === RentalStatus.CANCELLED) continue;
        const key = RentalService.rentalKey(r.id);
        const n = await this.rentalMessageRepository.countIncomingAfter(r.id, uid, after(key));
        bump(key, n);
      }
    }

    const items = [...unreadByKey.entries()].map(([key, unread]) => ({ key, unread }));
    const total = items.reduce((s, i) => s + i.unread, 0);
    return { total, items };
  }

  async markConversationRead(
    userId: string,
    body:
      | { kind: 'inquiry'; carId: string; threadRenterUserId: string }
      | { kind: 'rental'; rentalId: string }
  ): Promise<void> {
    await this.promotePendingRentals();
    const uid = String(userId).toLowerCase();
    let key: string;
    if (body.kind === 'inquiry') {
      const car = await this.carServiceClient.getCarById(body.carId);
      if (!car?.ownerId) {
        const err: Error & { statusCode?: number } = new Error('Car not found');
        err.statusCode = 404;
        throw err;
      }
      const tid = String(body.threadRenterUserId).toLowerCase();
      if (tid === uid) {
        const msgs = await this.carInquiryMessageRepository.findByThread(body.carId, body.threadRenterUserId);
        if (msgs.length === 0) {
          const err: Error & { statusCode?: number } = new Error('No messages in thread');
          err.statusCode = 404;
          throw err;
        }
      } else {
        if (String(car.ownerId).toLowerCase() !== uid) {
          const err: Error & { statusCode?: number } = new Error('Forbidden');
          err.statusCode = 403;
          throw err;
        }
        const msgs = await this.carInquiryMessageRepository.findByThread(body.carId, body.threadRenterUserId);
        if (msgs.length === 0) {
          const err: Error & { statusCode?: number } = new Error('No messages in thread');
          err.statusCode = 404;
          throw err;
        }
      }
      key = RentalService.inquiryKey(body.carId, body.threadRenterUserId);
    } else {
      const rental = await this.rentalRepository.findById(body.rentalId);
      if (!rental) {
        const err: Error & { statusCode?: number } = new Error('Rental not found');
        err.statusCode = 404;
        throw err;
      }
      await this.assertCanAccessRentalMessages(rental, uid);
      key = RentalService.rentalKey(body.rentalId);
    }
    await this.chatReadCursorRepository.upsert(uid, key, new Date());
  }
}
