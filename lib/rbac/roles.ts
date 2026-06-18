import type { Permission } from './permissions';

export type CrmRole = 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.read',
  'clients.read', 'clients.create', 'clients.update', 'clients.archive',
  'vacancies.read', 'vacancies.create', 'vacancies.update', 'vacancies.archive',
  'candidates.read', 'candidates.create', 'candidates.update', 'candidates.archive',
  'submissions.read', 'submissions.create', 'submissions.update',
  'pipeline.read', 'pipeline.update',
  'notes.read', 'notes.create',
  'activity.read',
  'team.read', 'team.manage',
  'roles.manage',
  'settings.read', 'settings.manage',
];

export const ROLE_PERMISSIONS: Record<CrmRole, Permission[]> = {
  admin: ALL_PERMISSIONS,

  recruiter: [
    'dashboard.read',
    'clients.read', 'clients.create', 'clients.update', 'clients.archive',
    'vacancies.read', 'vacancies.create', 'vacancies.update', 'vacancies.archive',
    'candidates.read', 'candidates.create', 'candidates.update', 'candidates.archive',
    'submissions.read', 'submissions.create', 'submissions.update',
    'pipeline.read', 'pipeline.update',
    'notes.read', 'notes.create',
    'activity.read',
    'team.read',
    'settings.read',
  ],

  hiring_manager: [
    'dashboard.read',
    'clients.read',
    'vacancies.read',
    'candidates.read',
    'submissions.read',
    'pipeline.read', 'pipeline.update',
    'notes.read', 'notes.create',
    'activity.read',
    'team.read',
    'settings.read',
  ],

  viewer: [
    'dashboard.read',
    'clients.read',
    'vacancies.read',
    'candidates.read',
    'pipeline.read',
    'submissions.read',
    'notes.read',
    'team.read',
    'settings.read',
  ],
};