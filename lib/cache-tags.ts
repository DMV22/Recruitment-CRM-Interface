export const cacheTags = {
  candidates: {
    list: (teamId: number) => `candidates-team-${teamId}`,
    detail: (candidateId: number) => `candidate-${candidateId}`,
  },

  clients: {
    list: (teamId: number) => `clients-team-${teamId}`,
    detail: (clientId: number) => `client-${clientId}`,
  },

  vacancies: {
    list: (teamId: number) => `vacancies-team-${teamId}`,
    detail: (vacancyId: number) => `vacancy-${vacancyId}`,
  },

  submissions: {
    list: (teamId: number) => `submissions-team-${teamId}`,
    detail: (submissionId: number) => `submission-${submissionId}`,
    byVacancy: (vacancyId: number) => `submissions-vacancy-${vacancyId}`,
    byCandidate: (candidateId: number) => `submissions-candidate-${candidateId}`,
    byClient: (clientId: number) => `submissions-client-${clientId}`,
  },

  notes: {
    byEntity: (entityType: string, entityId: number) => `notes-${entityType}-${entityId}`,
  },

  activity: {
    list: (teamId: number) => `activity-team-${teamId}`,
  },
} as const;
