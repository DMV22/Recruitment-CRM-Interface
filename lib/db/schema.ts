import { pgTable, pgEnum, serial, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const crmRoleEnum = pgEnum('crm_role', [
  'admin',
  'recruiter',
  'hiring_manager',
  'viewer',
]);

export const clientStatusEnum = pgEnum('client_status', [
  'prospect',
  'active',
  'inactive',
]);

export const vacancyStatusEnum = pgEnum('vacancy_status', [
  'open',
  'on_hold',
  'closed',
  'filled',
]);

export const vacancyPriorityEnum = pgEnum('vacancy_priority', [
  'low',
  'medium',
  'high',
]);

export const workTypeEnum = pgEnum('work_type', [
  'remote',
  'hybrid',
  'onsite',
]);

export const seniorityEnum = pgEnum('seniority', [
  'intern',
  'junior',
  'middle',
  'senior',
  'lead',
  'principal',
]);

export const candidateStatusEnum = pgEnum('candidate_status', [
  'active',
  'passive',
  'placed',
  'blacklisted',
]);

export const pipelineStageEnum = pgEnum('pipeline_stage', [
  'sourced',
  'screening',
  'hr_interview',
  'tech_interview',
  'client_interview',
  'offer',
  'hired',
  'rejected',
]);

export const noteEntityTypeEnum = pgEnum('note_entity_type', [
  'client',
  'vacancy',
  'candidate',
  'submission',
]);

// Existing Tables (kept + extended)

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  crmRole: crmRoleEnum('crm_role').notNull().default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  crmRole: crmRoleEnum('crm_role').notNull().default('viewer'),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// CRM Tables 

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 200 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  website: varchar('website', { length: 255 }),
  status: clientStatusEnum('status').notNull().default('prospect'),
  assignedUserId: integer('assigned_user_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientContacts = pgTable('client_contacts', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  position: varchar('position', { length: 100 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const vacancies = pgTable('vacancies', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  techStack: text('tech_stack'),
  seniority: seniorityEnum('seniority'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  location: varchar('location', { length: 100 }),
  workType: workTypeEnum('work_type').notNull().default('remote'),
  status: vacancyStatusEnum('status').notNull().default('open'),
  priority: vacancyPriorityEnum('priority').notNull().default('medium'),
  assignedRecruiterId: integer('assigned_recruiter_id').references(
    () => users.id
  ),
  hiringManagerId: integer('hiring_manager_id').references(() => users.id),
  deadlineAt: timestamp('deadline_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  location: varchar('location', { length: 100 }),
  techStack: text('tech_stack'),
  seniority: seniorityEnum('seniority'),
  salaryExpectation: integer('salary_expectation'),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  noticePeriod: varchar('notice_period', { length: 50 }),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  status: candidateStatusEnum('status').notNull().default('active'),
  source: varchar('source', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  vacancyId: integer('vacancy_id')
    .notNull()
    .references(() => vacancies.id),
  candidateId: integer('candidate_id')
    .notNull()
    .references(() => candidates.id),
  submittedBy: integer('submitted_by')
    .notNull()
    .references(() => users.id),
  currentStage: pipelineStageEnum('current_stage')
    .notNull()
    .default('sourced'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pipelineHistory = pgTable('pipeline_history', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => submissions.id),
  fromStage: pipelineStageEnum('from_stage'),
  toStage: pipelineStageEnum('to_stage').notNull(),
  changedBy: integer('changed_by')
    .notNull()
    .references(() => users.id),
  notes: text('notes'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
});

export const entityNotes = pgTable('entity_notes', {
  id: serial('id').primaryKey(),
  entityType: noteEntityTypeEnum('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  content: text('content').notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
