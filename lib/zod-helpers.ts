import { z } from 'zod';

/**
 * Converts empty inputs (“”) or null/undefined values to pure null before validating the string.
 */
export function createNullableString<T extends z.ZodType<string, any, any>>(customSchema: T) {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    return value;
  }, customSchema.nullable());
}

/**
 * Converts a text value or 'unassigned' to a number/null and validates it.
 */
export function createNullableNumber<T extends z.ZodType<number, any, any>>(customSchema: T) {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null || value === 'unassigned') {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }, customSchema.nullable());
}

/**
 * Converts an ISO date string from a form into a valid Date object or null.
 */
export function createNullableDate<T extends z.ZodType<Date, any, any>>(customSchema: T) {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const date = new Date(value as string);
    return Number.isNaN(date.getTime()) ? null : date;
  }, customSchema.nullable());
}
