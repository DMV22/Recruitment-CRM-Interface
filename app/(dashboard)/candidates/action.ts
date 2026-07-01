'use server';

import { z } from 'zod';

// ----- Helpers -----

// Сonverts the variable into a function that accepts a custom pattern
function createNullableString(customSchema: z.ZodTypeAny) {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    return value;
  }, customSchema.nullable());
}

function createNullableNumber(customSchema: z.ZodTypeAny) {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null || value === 'unassigned') {
      return null;
    }
    const num = Number(value);

    return Number.isNaN(num) ? null : num;
  }, customSchema.nullable());
}

// ----- Schema -----

const candidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: createNullableString(z.string().email('Invalid email')),
  phone: createNullableString(z.string().max(50)),
  location: createNullableString(z.string().max(100)),
  techStack: createNullableString(z.string().max(500)),
  seniority: z.preprocess(
    (value) => (value === '' || value === 'none' ? null : value),
    z.enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal'])
  ),
  salaryExpectation: createNullableNumber(z.number().min(0)),
  currency: z.preprocess(
    (value) => (value === '' || value == null ? 'USD' : value),
    z.string().max(10)
  ),
  noticePeriod: createNullableString(z.string().max(50)),
  linkedinUrl: createNullableString(z.string().max(255)),
  status: z.enum(['active', 'passive', 'placed', 'blacklisted']).default('active'),
  source: createNullableString(z.string().max(100)),
  notes: createNullableString(z.string().max(2000)),
});

export type CandidateFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

function validateCandidateForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return candidateSchema.safeParse(raw);
}
