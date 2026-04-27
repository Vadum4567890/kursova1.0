/** Ключі збігаються з rental-service (RentalService.inquiryKey / rentalKey). */
export function inquiryConversationKey(carId: string, threadRenterUserId: string): string {
  return `inq:${carId}:${threadRenterUserId}`;
}

export function rentalConversationKey(rentalId: string): string {
  return `rnt:${rentalId}`;
}
