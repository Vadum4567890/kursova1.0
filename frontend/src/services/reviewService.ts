import api from './api';
import {
  BookingReviewStatus,
  CarRatingSummary,
  Review,
  ReviewableBooking,
  SubmitReviewData,
  UpdateReviewData,
} from '../interfaces';

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

function mapReview(raw: any): Review {
  return {
    id: String(raw.id),
    bookingId: String(raw.bookingId),
    reviewerUserId: String(raw.reviewerUserId),
    revieweeUserId: String(raw.revieweeUserId),
    carId: String(raw.carId),
    reviewType: raw.reviewType,
    revieweeType: raw.revieweeType,
    status: raw.status,
    comment: raw.comment ?? null,
    submittedAt: String(raw.submittedAt ?? ''),
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    scores: typeof raw.scores === 'object' && raw.scores ? raw.scores : {},
  };
}

export const reviewService = {
  async getEligibleReviews(): Promise<ReviewableBooking[]> {
    const response = await api.get('/reviews/eligible');
    const rows = unwrapData<any[]>(response.data) || [];
    return rows.map((row) => ({
      bookingId: String(row.bookingId),
      carId: row.carId,
      ownerUserId: row.ownerUserId ? String(row.ownerUserId) : null,
      renterUserId: row.renterUserId ? String(row.renterUserId) : undefined,
      role: row.role,
      reviewStatus: row.reviewStatus,
      reviewWindowClosesAt: row.reviewWindowClosesAt ? String(row.reviewWindowClosesAt) : undefined,
      myReviewSubmitted: Boolean(row.myReviewSubmitted),
      counterpartyReviewSubmitted: Boolean(row.counterpartyReviewSubmitted),
      canSubmit: typeof row.canSubmit === 'boolean' ? row.canSubmit : undefined,
      myReview: row.myReview ? mapReview(row.myReview) : null,
    }));
  },

  async getBookingReviewStatus(bookingId: number | string): Promise<BookingReviewStatus> {
    const response = await api.get(`/reviews/booking/${bookingId}/status`);
    const data = unwrapData<any>(response.data);
    return {
      bookingId: String(data.bookingId),
      canSubmit: Boolean(data.canSubmit),
      myReviewSubmitted: Boolean(data.myReviewSubmitted),
      counterpartyReviewSubmitted: Boolean(data.counterpartyReviewSubmitted),
      published: Boolean(data.published),
      expired: Boolean(data.expired),
      reviewStatus: data.reviewStatus,
      reviewWindowClosesAt: data.reviewWindowClosesAt ? String(data.reviewWindowClosesAt) : undefined,
    };
  },

  async submitReview(payload: SubmitReviewData): Promise<{
    review: Review;
    counterpartPublished: boolean;
    reviewStatus: string;
  }> {
    const response = await api.post('/reviews', payload);
    const data = unwrapData<any>(response.data);
    return {
      review: mapReview(data.review),
      counterpartPublished: Boolean(data.counterpartPublished),
      reviewStatus: String(data.reviewStatus),
    };
  },

  async getMyReview(bookingId: number | string): Promise<Review | null> {
    const response = await api.get(`/reviews/booking/${bookingId}`);
    const data = unwrapData<any>(response.data);
    return data ? mapReview(data) : null;
  },

  async updateReview(
    bookingId: number | string,
    payload: UpdateReviewData
  ): Promise<{
    review: Review;
    counterpartPublished: boolean;
    reviewStatus: string;
  }> {
    const response = await api.patch(`/reviews/booking/${bookingId}`, payload);
    const data = unwrapData<any>(response.data);
    return {
      review: mapReview(data.review),
      counterpartPublished: Boolean(data.counterpartPublished),
      reviewStatus: String(data.reviewStatus),
    };
  },

  async getCarReviews(carId: number | string): Promise<Review[]> {
    const response = await api.get(`/reviews/cars/${carId}`);
    const rows = unwrapData<any[]>(response.data) || [];
    return rows.map(mapReview);
  },

  async getUserReviews(userId: number | string, role?: 'owner' | 'renter'): Promise<Review[]> {
    const response = await api.get(`/reviews/users/${userId}`, {
      params: role ? { role } : undefined,
    });
    const rows = unwrapData<any[]>(response.data) || [];
    return rows.map(mapReview);
  },

  async getCarRating(carId: number | string): Promise<CarRatingSummary> {
    const response = await api.get(`/cars/${carId}/rating`);
    const data = unwrapData<any>(response.data);
    return {
      carId: String(data.carId ?? carId),
      rating: Number(data.rating || 0),
      reviewsCount: Number(data.reviewsCount || 0),
      cleanlinessAvg: Number(data.cleanlinessAvg || 0),
      technicalConditionAvg: Number(data.technicalConditionAvg || 0),
      accuracyOfDescriptionAvg: Number(data.accuracyOfDescriptionAvg || 0),
      completedRentalsCount: Number(data.completedRentalsCount || 0),
    };
  },
};
