import { Rental } from '../interfaces';

/**
 * Підпис орендаря для таблиць: ім’я з прокату / клієнтського списку, без показу сирого UUID.
 */
export function getRenterDisplayName(
  rental: Rental,
  clientNamesByUserId?: Map<string, string>
): string {
  const fromApi =
    rental.client?.fullName?.trim() ||
    rental.renter?.fullName?.trim() ||
    rental.renter?.email?.trim();
  if (fromApi) return fromApi;

  const uid = rental.renterUserId?.trim();
  if (uid && clientNamesByUserId?.has(uid)) {
    return clientNamesByUserId.get(uid)!;
  }

  if (rental.clientId != null && String(rental.clientId) !== '') {
    return `Клієнт #${rental.clientId}`;
  }

  if (uid) {
    return 'Орендар (профіль недоступний)';
  }

  return 'Невідомо';
}
