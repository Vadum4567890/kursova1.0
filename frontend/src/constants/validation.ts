/**
 * Validation constants used across the application
 */

export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_VALIDATION_MESSAGE = `Пароль повинен містити мінімум ${MIN_PASSWORD_LENGTH} символів`;

export const FULL_NAME_MIN_LENGTH = 5;
export const FULL_NAME_MAX_LENGTH = 80;
export const ADDRESS_MIN_LENGTH = 5;
export const ADDRESS_MAX_LENGTH = 160;

export const FULL_NAME_VALIDATION_MESSAGE =
  'Вкажіть повне ім’я українською або латиницею, мінімум ім’я та прізвище';

export const PHONE_VALIDATION_MESSAGE =
  'Вкажіть коректний номер телефону, наприклад +380671234567 або 0671234567';

export const ADDRESS_VALIDATION_MESSAGE =
  `Адреса повинна містити від ${ADDRESS_MIN_LENGTH} до ${ADDRESS_MAX_LENGTH} символів`;

export function normalizePhoneInput(value: string): string {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+38${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits}`;
  }
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return raw;
}

export function validateFullName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Повне ім’я обов’язкове';
  if (normalized.length < FULL_NAME_MIN_LENGTH || normalized.length > FULL_NAME_MAX_LENGTH) {
    return `Повне ім’я повинно містити від ${FULL_NAME_MIN_LENGTH} до ${FULL_NAME_MAX_LENGTH} символів`;
  }
  if (normalized.split(' ').length < 2) {
    return FULL_NAME_VALIDATION_MESSAGE;
  }
  if (!/^[\p{L}'’-]+(?:\s+[\p{L}'’-]+)+$/u.test(normalized)) {
    return FULL_NAME_VALIDATION_MESSAGE;
  }
  return '';
}

export function validatePhone(value: string): string {
  const normalized = normalizePhoneInput(value);
  if (!value.trim()) return 'Телефон обов’язковий';
  if (!/^\+\d{10,15}$/.test(normalized)) {
    return PHONE_VALIDATION_MESSAGE;
  }
  return '';
}

export function validateAddress(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Адреса обов’язкова';
  if (normalized.length < ADDRESS_MIN_LENGTH || normalized.length > ADDRESS_MAX_LENGTH) {
    return ADDRESS_VALIDATION_MESSAGE;
  }
  if (!/^[\p{L}\p{N}\s.,'’/#№()-]+$/u.test(normalized)) {
    return 'Адреса містить недопустимі символи';
  }
  return '';
}

