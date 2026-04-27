import axios from 'axios';
import api from './api';
import { Rental, CreateRentalData } from '../interfaces';
import { mapRentalFromApi, mapRentalsList } from './rentalMapper';
import { isUpstreamUnavailable } from '../utils/upstreamErrors';

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const rentalService = {
  async getAllRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getActiveRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals/active');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getRentalById(id: number | string): Promise<Rental> {
    const response = await api.get<unknown>(`/rentals/${id}`);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async getRentalsByClientId(clientId: number | string): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>(`/rentals/client/${clientId}`);
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async getRentalsByCarId(carId: number | string): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>(`/rentals/car/${carId}`);
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async createRental(data: CreateRentalData): Promise<Rental> {
    const payload = data.renterUserId
      ? data
      : {
          ...data,
          ...(data.clientId !== undefined ? { renterUserId: String(data.clientId) } : {}),
        };
    const response = await api.post<unknown>('/rentals', payload);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async completeRental(id: number | string, actualEndDate?: string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${id}/complete`, { actualEndDate });
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async cancelRental(id: number | string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${id}/cancel`);
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async addPenalty(id: number | string, amount: number, reason: string): Promise<void> {
    await api.post(`/rentals/${id}/penalty`, { amount, reason });
  },

  async getMyRentals(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals/my');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  /** Бронювання по авто поточного користувача як орендодавця */
  async getOwnerBookings(): Promise<Rental[]> {
    try {
      const response = await api.get<unknown>('/rentals/me/owner-bookings');
      return mapRentalsList(response.data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  async approveBookingAsOwner(rentalId: number | string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${rentalId}/approve`, {});
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async rejectBookingAsOwner(rentalId: number | string): Promise<Rental> {
    const response = await api.post<unknown>(`/rentals/${rentalId}/reject`, {});
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async createBooking(carId: number | string, startDate: string, expectedEndDate: string): Promise<Rental> {
    const response = await api.post<unknown>('/rentals/book', {
      carId,
      startDate,
      expectedEndDate,
    });
    const raw = unwrapData<Record<string, unknown>>(response.data);
    return mapRentalFromApi(raw);
  },

  async getLandlordContact(carId: number | string): Promise<{
    fullName: string;
    phone: string | null;
    email: string;
  } | null> {
    try {
      const response = await api.get<unknown>(`/rentals/car/${carId}/landlord-contact`);
      return unwrapData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getUnreadChatsSummary(): Promise<{
    total: number;
    items: Array<{ key: string; unread: number }>;
  }> {
    const response = await api.get<unknown>('/rentals/my/unread-chats');
    return unwrapData(response.data);
  },

  async markConversationRead(
    body:
      | { kind: 'inquiry'; carId: string | number; threadRenterUserId: string }
      | { kind: 'rental'; rentalId: string | number }
  ): Promise<void> {
    await api.post('/rentals/my/conversations/read', body);
  },

  /** Контакти орендаря в inquiry-чаті (лише для власника авто). */
  async getInquiryRenterContact(
    carId: number | string,
    renterId: string
  ): Promise<{ fullName: string; phone: string | null; email: string | null }> {
    const response = await api.get<unknown>(`/rentals/car/${carId}/inquiry-renter-contact`, {
      params: { renterId },
    });
    return unwrapData(response.data);
  },

  async getRentalMessages(
    rentalId: number | string
  ): Promise<Array<{ id: string; senderUserId: string; body: string; createdAt: string }>> {
    try {
      const response = await api.get<unknown>(`/rentals/${rentalId}/messages`);
      return unwrapData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  async postRentalMessage(rentalId: number | string, body: string): Promise<{ id: string }> {
    const response = await api.post<unknown>(`/rentals/${rentalId}/messages`, { body });
    return unwrapData(response.data);
  },

  /** Усі inquiry-діалоги по авто власника (хаб «Чати»). */
  async getMyInquiryChatsAsOwner(): Promise<
    Array<{
      carId: string;
      carTitle: string;
      threadRenterUserId: string;
      lastMessageAt: string;
      preview: string;
    }>
  > {
    try {
      const response = await api.get<unknown>('/rentals/my/inquiry-chats');
      return unwrapData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  async getCarInquiryThreads(
    carId: number | string
  ): Promise<Array<{ threadRenterUserId: string; lastMessageAt: string; preview: string }>> {
    const response = await api.get<unknown>(`/rentals/car/${carId}/inquiry-threads`);
    return unwrapData(response.data);
  },

  async getCarInquiryMessages(
    carId: number | string,
    /** Для власника авто — UUID орендаря (тред). */
    renterId?: string
  ): Promise<Array<{ id: string; senderUserId: string; body: string; createdAt: string }>> {
    try {
      const response = await api.get<unknown>(`/rentals/car/${carId}/inquiry-messages`, {
        params: renterId ? { renterId } : undefined,
      });
      return unwrapData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  async postCarInquiryMessage(
    carId: number | string,
    body: string,
    threadRenterUserId?: string
  ): Promise<{ id: string }> {
    try {
      const response = await api.post<unknown>(`/rentals/car/${carId}/inquiry-messages`, {
        body,
        ...(threadRenterUserId ? { threadRenterUserId } : {}),
      });
      return unwrapData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const payload = err.response.data as { error?: { message?: string }; message?: string };
        const msg = payload.error?.message ?? payload.message ?? err.message;
        throw new Error(msg);
      }
      throw err;
    }
  },
};
