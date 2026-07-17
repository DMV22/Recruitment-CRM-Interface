import { logActivity } from '@/lib/activity/log-activity';
import { db } from '@/lib/db/drizzle';
import {
  submissions,
  pipelineHistory,
  vacancies,
  candidates,
  clients,
  users,
  ActivityType,
  NewSubmission,
  type PipelineStage,
} from '@/lib/db/schema';
import { eq, and, desc, count, notInArray } from 'drizzle-orm';

// ----- Types -----

export type SubmissionsFilter = {
  vacancyId?: number;
  candidateId?: number;
  stage?: PipelineStage;
  page?: number;
  perPage?: number;
};

export type SubmissionRow = {
  id: number;
  currentStage: PipelineStage;
  rejectionReason: string | null;
  notes: string | null;
  submittedAt: Date;
  updatedAt: Date;
  vacancy: {
    id: number;
    title: string;
    client: { id: number; name: string };
  };
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    seniority: string | null;
  };
  submittedBy: { id: number; name: string | null };
};

// Creating a Universal Mapper
function mapSubmissionRow(r: Record<string, any>): SubmissionRow {
  return {
    id: r.id,
    currentStage: r.currentStage,
    rejectionReason: r.rejectionReason,
    notes: r.notes,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    vacancy: {
      id: r.vacancyId,
      title: r.vacancyTitle,
      client: { id: r.clientId, name: r.clientName },
    },
    candidate: {
      id: r.candidateId,
      firstName: r.candidateFirstName,
      lastName: r.candidateLastName,
      email: r.candidateEmail,
      seniority: r.candidateSeniority,
      // Add dynamic support for techStack (if the field is present in the request)
      ...(r.candidateTechStack !== undefined && { techStack: r.candidateTechStack }),
    },
    submittedBy: { id: r.submittedById, name: r.submittedByName },
  };
}

// ----- List -----

export async function getSubmissions(
  teamId: number,
  userId: number,
  crmRole: string,
  filter: SubmissionsFilter = {}
) {
  const { vacancyId, candidateId, stage, page = 1, perPage = 25 } = filter;
  const offset = (page - 1) * perPage;

  // 1. Dynamically set filtering conditions
  const conditions = [eq(vacancies.teamId, teamId)];

  // Role check: Hiring Manager sees only their vacancies (we do this via direct equality in SQL)
  if (crmRole === 'hiring_manager') {
    conditions.push(eq(vacancies.hiringManagerId, userId));
  }

  if (vacancyId) conditions.push(eq(submissions.vacancyId, vacancyId));
  if (candidateId) conditions.push(eq(submissions.candidateId, candidateId));
  if (stage) conditions.push(eq(submissions.currentStage, stage));

  const whereClause = and(...conditions);

  // 2. Execute queries in parallel
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: submissions.id,
        currentStage: submissions.currentStage,
        rejectionReason: submissions.rejectionReason,
        notes: submissions.notes,
        submittedAt: submissions.submittedAt,
        updatedAt: submissions.updatedAt,
        vacancyId: vacancies.id,
        vacancyTitle: vacancies.title,
        clientId: clients.id,
        clientName: clients.name,
        candidateId: candidates.id,
        candidateFirstName: candidates.firstName,
        candidateLastName: candidates.lastName,
        candidateEmail: candidates.email,
        candidateSeniority: candidates.seniority,
        submittedById: users.id,
        submittedByName: users.name,
      })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .innerJoin(clients, eq(vacancies.clientId, clients.id))
      .innerJoin(candidates, eq(submissions.candidateId, candidates.id))
      .innerJoin(users, eq(submissions.submittedBy, users.id))
      .where(whereClause)
      .orderBy(desc(submissions.submittedAt))
      .limit(perPage)
      .offset(offset),

    // For count we need to join with vacancies, as they contain teamId and hiringManagerId
    db
      .select({ total: count() })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(whereClause),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    data: rows.map(mapSubmissionRow),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ----- Single -----

export async function getSubmissionById(id: number, teamId: number) {
  const [row] = await db
    .select({
      id: submissions.id,
      currentStage: submissions.currentStage,
      rejectionReason: submissions.rejectionReason,
      notes: submissions.notes,
      submittedAt: submissions.submittedAt,
      updatedAt: submissions.updatedAt,
      vacancyId: vacancies.id,
      vacancyTitle: vacancies.title,
      clientId: clients.id,
      clientName: clients.name,
      candidateId: candidates.id,
      candidateFirstName: candidates.firstName,
      candidateLastName: candidates.lastName,
      candidateEmail: candidates.email,
      candidateSeniority: candidates.seniority,
      submittedById: users.id,
      submittedByName: users.name,
    })
    .from(submissions)
    .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
    .innerJoin(clients, eq(vacancies.clientId, clients.id))
    .innerJoin(candidates, eq(submissions.candidateId, candidates.id))
    .innerJoin(users, eq(submissions.submittedBy, users.id))
    .where(and(eq(submissions.id, id), eq(vacancies.teamId, teamId)));

  if (!row) return null;

  return mapSubmissionRow(row);
}

// ----- Create -----

export async function createSubmission(
  data: Omit<NewSubmission, 'id' | 'submittedAt' | 'updatedAt'>,
  teamId: number,
  userId: number
) {
  return await db.transaction(async (tx) => {
    // 1. Insert the new submission
    const [submission] = await tx.insert(submissions).values(data).returning();

    // 2. Record the starting point in the recruitment pipeline history
    await tx.insert(pipelineHistory).values({
      submissionId: submission.id,
      fromStage: null,
      toStage: submission.currentStage,
      changedBy: userId,
      notes: 'Submission created',
    });

    // 3. Record the action in the company's general audit log
    await logActivity(
      tx,
      teamId,
      userId,
      ActivityType.CREATE_SUBMISSION,
      'submission',
      submission.id
    );

    return submission;
  });
}

// ----- Update Stage -----

export async function updateSubmissionStage(
  id: number,
  teamId: number,
  toStage: PipelineStage,
  userId: number,
  notes?: string | null,
  rejectionReason?: string | null
) {
  return await db.transaction(async (tx) => {
    // Fetch current stage
    const [current] = await tx
      .select({ currentStage: submissions.currentStage })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(and(eq(submissions.id, id), eq(vacancies.teamId, teamId)));

    if (!current) return null;

    const [updated] = await tx
      .update(submissions)
      .set({
        currentStage: toStage,
        rejectionReason: rejectionReason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, id))
      .returning();

    await tx.insert(pipelineHistory).values({
      submissionId: id,
      fromStage: current.currentStage,
      toStage,
      changedBy: userId,
      notes: notes ?? null,
    });

    await logActivity(tx, teamId, userId, ActivityType.UPDATE_SUBMISSION_STAGE, 'submission', id);

    return updated;
  });
}

// ----- Submission History -----

export async function getSubmissionHistory(submissionId: number, teamId: number) {
  return db
    .select({
      id: pipelineHistory.id,
      fromStage: pipelineHistory.fromStage,
      toStage: pipelineHistory.toStage,
      notes: pipelineHistory.notes,
      changedAt: pipelineHistory.changedAt,
      changedByName: users.name,
    })
    .from(pipelineHistory)
    .innerJoin(users, eq(pipelineHistory.changedBy, users.id))
    .innerJoin(submissions, eq(pipelineHistory.submissionId, submissions.id))
    .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id)) // Protecting history: We check the "submissions" => "vacancies" section to verify the teamId
    .where(and(eq(pipelineHistory.submissionId, submissionId), eq(vacancies.teamId, teamId)))
    .orderBy(desc(pipelineHistory.changedAt));
}

// ----- Candidates for vacancy (grouped by stage) -----

export async function getSubmissionsByVacancy(vacancyId: number, teamId: number) {
  const rows = await db
    .select({
      id: submissions.id,
      currentStage: submissions.currentStage,
      rejectionReason: submissions.rejectionReason,
      notes: submissions.notes,
      submittedAt: submissions.submittedAt,
      candidateId: candidates.id,
      candidateFirstName: candidates.firstName,
      candidateLastName: candidates.lastName,
      candidateEmail: candidates.email,
      candidateSeniority: candidates.seniority,
      candidateTechStack: candidates.techStack,
      submittedById: users.id,
      submittedByName: users.name,
    })
    .from(submissions)
    .innerJoin(candidates, eq(submissions.candidateId, candidates.id))
    .innerJoin(users, eq(submissions.submittedBy, users.id))
    .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id)) // Validating the list: checking that the job opening itself belongs to this team
    .where(and(eq(submissions.vacancyId, vacancyId), eq(vacancies.teamId, teamId)))
    .orderBy(submissions.currentStage, desc(submissions.submittedAt));

  return rows.map(mapSubmissionRow);
}

// ----- Candidates available for submission to a vacancy -----

export async function getCandidatesForSubmit(teamId: number, vacancyId: number) {
  // 1. Fetch candidates that have already been submitted for this vacancy
  const alreadySubmitted = await db
    .select({ candidateId: submissions.candidateId })
    .from(submissions)
    .where(eq(submissions.vacancyId, vacancyId));

  const excludeIds = alreadySubmitted.map((s) => s.candidateId);

  // 2. Dynamically set filtering conditions for candidates that belong to the team and are not already submitted
  const conditions = [eq(candidates.teamId, teamId)];

  // Add filter to exclude candidates that have already been submitted for this vacancy
  if (excludeIds.length > 0) {
    conditions.push(notInArray(candidates.id, excludeIds));
  }

  // 3. Make a single clean query with a mandatory await
  return await db
    .select({
      id: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      seniority: candidates.seniority,
      techStack: candidates.techStack,
    })
    .from(candidates)
    .where(and(...conditions))
    .orderBy(candidates.firstName);
}
