import { Rental, RentalResolution } from '../interfaces';

export const PROBLEM_LIFECYCLE_STATES: Array<NonNullable<Rental['lifecycleState']>> = [
  'pickup_partially_confirmed',
  'pickup_disputed',
  'no_show',
  'return_due',
  'return_partially_confirmed',
  'return_disputed',
];

export function isProblemRental(rental: Rental): boolean {
  return rental.lifecycleState ? PROBLEM_LIFECYCLE_STATES.includes(rental.lifecycleState) : false;
}

export function getLifecycleLabel(rental: Pick<Rental, 'lifecycleState'>): string | null {
  switch (rental.lifecycleState) {
    case 'awaiting_owner_approval':
      return 'Очікує рішення орендодавця';
    case 'awaiting_pickup':
      return 'Очікує передачі авто';
    case 'pickup_partially_confirmed':
      return 'Передачу підтвердила одна сторона';
    case 'pickup_disputed':
      return 'Спір щодо передачі';
    case 'no_show':
      return 'Неявка або зірвана передача';
    case 'active':
      return 'Активний прокат';
    case 'return_due':
      return 'Очікує повернення';
    case 'return_partially_confirmed':
      return 'Повернення підтвердила одна сторона';
    case 'return_disputed':
      return 'Спір щодо повернення';
    case 'completed':
      return 'Завершено';
    case 'cancelled':
      return 'Скасовано';
    default:
      return null;
  }
}

export function getResolutionTypeLabel(type?: RentalResolution['resolutionType']): string {
  switch (type) {
    case 'admin_activated':
      return 'Адмін підтвердив передачу';
    case 'admin_completed':
      return 'Адмін завершив прокат';
    case 'renter_no_show':
      return 'Орендар не зʼявився';
    case 'owner_no_show':
      return 'Орендодавець не передав авто';
    case 'mutual_cancel':
      return 'Скасування за домовленістю';
    case 'admin_cancel':
      return 'Адмін скасував прокат';
    case 'pickup_dispute':
      return 'Спір щодо передачі';
    case 'return_dispute':
      return 'Спір щодо повернення';
    default:
      return 'Рішення не вказано';
  }
}

export function getResolutionActionLabel(action?: string): string {
  switch (action) {
    case 'activate':
      return 'Активація';
    case 'complete':
      return 'Завершення';
    case 'cancel':
      return 'Скасування';
    case 'mark_no_show':
      return 'No-show';
    case 'mark_pickup_disputed':
      return 'Спір передачі';
    case 'mark_return_disputed':
      return 'Спір повернення';
    default:
      return action || 'Дія не вказана';
  }
}
