import type { User } from '@/lib/db/schema';
import type { Permission } from './permissions';
import type { CrmRole } from './roles';
import { ROLE_PERMISSIONS } from './roles';

export function hasPermission(user: User, permission: Permission): boolean {
  const role = user.crmRole as CrmRole;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function requirePermission(user: User, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
}

/**
 * Returns the data scope for a user:
 * 'all'      -> admin, recruiter (see everything)
 * 'assigned' -> hiring_manager (sees only their assigned records)
 * 'none'     -> viewer (read-only, no write scope)
 */
export function getAssignedScope(user: User): 'all' | 'assigned' | 'none' {
  const role = user.crmRole as CrmRole;
  switch (role) {
    case 'admin':
    case 'recruiter':
      return 'all';
    case 'hiring_manager':
      return 'assigned';
    case 'viewer':
    default:
      return 'none';
  }
}

/**
 * Checks if a user can perform a pipeline stage transition.
 * hiring_manager can only move: tech_interview -> offer | rejected
 * admin & recruiter can move between any stages
 */
export function canTransitionStage(
  user: User,
  fromStage: string,
  toStage: string
): boolean {
  const role = user.crmRole as CrmRole;

  if (!hasPermission(user, 'pipeline.update')) return false;

  if (role === 'admin' || role === 'recruiter') return true;

  if (role === 'hiring_manager') {
    const allowedTransitions: Record<string, string[]> = {
      tech_interview: ['client_interview', 'offer', 'rejected'],
      client_interview: ['offer', 'rejected'],
    };
    return allowedTransitions[fromStage]?.includes(toStage) ?? false;
  }

  return false;
}