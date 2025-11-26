/**
 * Utility functions for filtering data
 */

export function filterBySearchTerm<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearchTerm);
    })
  );
}

export function filterByField<T>(
  items: T[],
  field: keyof T,
  value: any
): T[] {
  if (!value) return items;
  return items.filter((item) => item[field] === value);
}

export function filterByMultipleFields<T>(
  items: T[],
  filters: Partial<Record<keyof T, any>>
): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return item[key as keyof T] === value;
    })
  );
}

