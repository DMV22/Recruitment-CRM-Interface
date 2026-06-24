'use server';

import { z } from 'zod';

// ----- Schema -----

const vacancySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  clientId: z.coerce.number({ invalid_type_error: 'Client is required' }).min(1, 'Client is required'),
  description: z.string().max(5000).optional().or(z.literal('')),
  techStack: z.string().max(500).optional().or(z.literal('')),
  seniority: z
    .enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal'])
    .optional()
    .or(z.literal('')),
  salaryMin: z.coerce.number().min(0).optional().or(z.literal('')),
  salaryMax: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.string().max(10).default('USD'),
  location: z.string().max(100).optional().or(z.literal('')),
  workType: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),
  status: z.enum(['open', 'on_hold', 'closed', 'filled']).default('open'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedRecruiterId: z.coerce.number().optional().or(z.literal('')),
  hiringManagerId: z.coerce.number().optional().or(z.literal('')),
  deadlineAt: z.string().optional().or(z.literal('')),
});