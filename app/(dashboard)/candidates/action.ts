'use server';

import { z } from 'zod';

// ----- Helpers -----

const nullableString = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  return value;
}, z.string().nullable());

const nullableNumber = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null || value === 'unassigned') {
    return null;
  }
  const num = Number(value);

  return Number.isNaN(num) ? null : num;
}, z.number().min(0).nullable());

// ----- Schema -----

const candidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: nullableString.pipe(z.string().email('Invalid email').nullable()),
  phone: nullableString.pipe(z.string().max(50).nullable()),
  location: nullableString.pipe(z.string().max(100).nullable()),
  techStack: nullableString.pipe(z.string().max(500).nullable()),
  seniority: z.preprocess(
    (value) => (value === '' || value === 'none' ? null : value),
    z.enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal']).nullable()
  ),
  salaryExpectation: nullableNumber,
  currency: z.preprocess(
    (value) => (value === '' || value == null ? 'USD' : value),
    z.string().max(10)
  ),
  noticePeriod: nullableString.pipe(z.string().max(50).nullable()),
  linkedinUrl: nullableString.pipe(z.string().max(255).nullable()),
  status: z.enum(['active', 'passive', 'placed', 'blacklisted']).default('active'),
  source: nullableString.pipe(z.string().max(100).nullable()),
  notes: nullableString.pipe(z.string().max(2000).nullable()),
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
