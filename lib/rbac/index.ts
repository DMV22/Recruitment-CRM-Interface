export type { Permission } from './permissions';
export type { CrmRole } from './roles';
export { ROLE_PERMISSIONS } from './roles';
export { hasPermission, requirePermission, getAssignedScope, canTransitionStage } from './guards';