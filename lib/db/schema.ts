import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const crmRoleEnum = pgEnum('crm_role', ['admin', 'recruiter', 'hiring_manager', 'viewer']);

export const clientStatusEnum = pgEnum('client_status', ['prospect', 'active', 'inactive']);

export const vacancyStatusEnum = pgEnum('vacancy_status', ['open', 'on_hold', 'closed', 'filled']);

export const vacancyPriorityEnum = pgEnum('vacancy_priority', ['low', 'medium', 'high']);

export const workTypeEnum = pgEnum('work_type', ['remote', 'hybrid', 'onsite']);

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
  assignedRecruiterId: integer('assigned_recruiter_id').references(() => users.id),
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
  deletedAt: timestamp('deleted_at'),
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
  currentStage: pipelineStageEnum('current_stage').notNull().default('sourced'),
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

// Relations

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  clients: many(clients),
  vacancies: many(vacancies),
  candidates: many(candidates),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  assignedClients: many(clients),
  assignedVacancies: many(vacancies, { relationName: 'recruiter' }),
  managedVacancies: many(vacancies, { relationName: 'hiringManager' }),
  submissions: many(submissions),
  pipelineChanges: many(pipelineHistory),
  entityNotes: many(entityNotes),
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

export const clientsRelations = relations(clients, ({ one, many }) => ({
  team: one(teams, {
    fields: [clients.teamId],
    references: [teams.id],
  }),
  assignedUser: one(users, {
    fields: [clients.assignedUserId],
    references: [users.id],
  }),
  contacts: many(clientContacts),
  vacancies: many(vacancies),
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
}));

export const vacanciesRelations = relations(vacancies, ({ one, many }) => ({
  team: one(teams, {
    fields: [vacancies.teamId],
    references: [teams.id],
  }),
  client: one(clients, {
    fields: [vacancies.clientId],
    references: [clients.id],
  }),
  assignedRecruiter: one(users, {
    fields: [vacancies.assignedRecruiterId],
    references: [users.id],
    relationName: 'recruiter',
  }),
  hiringManager: one(users, {
    fields: [vacancies.hiringManagerId],
    references: [users.id],
    relationName: 'hiringManager',
  }),
  submissions: many(submissions),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  team: one(teams, {
    fields: [candidates.teamId],
    references: [teams.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  vacancy: one(vacancies, {
    fields: [submissions.vacancyId],
    references: [vacancies.id],
  }),
  candidate: one(candidates, {
    fields: [submissions.candidateId],
    references: [candidates.id],
  }),
  submittedBy: one(users, {
    fields: [submissions.submittedBy],
    references: [users.id],
  }),
  history: many(pipelineHistory),
}));

export const pipelineHistoryRelations = relations(pipelineHistory, ({ one }) => ({
  submission: one(submissions, {
    fields: [pipelineHistory.submissionId],
    references: [submissions.id],
  }),
  changedBy: one(users, {
    fields: [pipelineHistory.changedBy],
    references: [users.id],
  }),
}));

export const entityNotesRelations = relations(entityNotes, ({ one }) => ({
  createdBy: one(users, {
    fields: [entityNotes.createdBy],
    references: [users.id],
  }),
}));

// Types

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

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientContact = typeof clientContacts.$inferSelect;
export type NewClientContact = typeof clientContacts.$inferInsert;
export type Vacancy = typeof vacancies.$inferSelect;
export type NewVacancy = typeof vacancies.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type PipelineHistory = typeof pipelineHistory.$inferSelect;
export type NewPipelineHistory = typeof pipelineHistory.$inferInsert;
export type EntityNote = typeof entityNotes.$inferSelect;
export type NewEntityNote = typeof entityNotes.$inferInsert;

// Enums & Constants

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
  CHANGE_USER_ROLE = 'CHANGE_USER_ROLE',
  REVOKE_TEAM_ACCESS = 'REVOKE_TEAM_ACCESS',

  // CRM
  CREATE_CLIENT = 'CREATE_CLIENT',
  UPDATE_CLIENT = 'UPDATE_CLIENT',
  ARCHIVE_CLIENT = 'ARCHIVE_CLIENT',
  CREATE_VACANCY = 'CREATE_VACANCY',
  UPDATE_VACANCY = 'UPDATE_VACANCY',
  ARCHIVE_VACANCY = 'ARCHIVE_VACANCY',
  CREATE_CANDIDATE = 'CREATE_CANDIDATE',
  UPDATE_CANDIDATE = 'UPDATE_CANDIDATE',
  ARCHIVE_CANDIDATE = 'ARCHIVE_CANDIDATE',
  CREATE_SUBMISSION = 'CREATE_SUBMISSION',
  UPDATE_SUBMISSION_STAGE = 'UPDATE_SUBMISSION_STAGE',
  CREATE_NOTE = 'CREATE_NOTE',
  DELETE_NOTE = 'DELETE_NOTE',
}

// PIPELINE_STAGES

export const PIPELINE_STAGES = [
  'sourced',
  'screening',
  'hr_interview',
  'tech_interview',
  'client_interview',
  'offer',
  'hired',
  'rejected',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  sourced: 'Sourced',
  screening: 'Screening',
  hr_interview: 'HR Interview',
  tech_interview: 'Tech Interview',
  client_interview: 'Client Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};
