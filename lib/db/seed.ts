import { db } from './drizzle';
import { users, teams, teamMembers, clients, clientContacts, vacancies, candidates, submissions, pipelineHistory } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  console.log(' Starting seed...');

  // Team

  const [team] = await db
    .insert(teams)
    .values({ name: 'Alpha Recruit Agency' })
    .returning();

  // Users

  const password = 'password123';
  const hash = await hashPassword(password);

  const [admin, recruiter, hiringManager, viewer] = await db
    .insert(users)
    .values([
      {
        name: 'Alice Admin',
        email: 'admin@crm.dev',
        passwordHash: hash,
        role: 'owner',
        crmRole: 'admin',
      },
      {
        name: 'Bob Recruiter',
        email: 'recruiter@crm.dev',
        passwordHash: hash,
        role: 'member',
        crmRole: 'recruiter',
      },
      {
        name: 'Carol Manager',
        email: 'manager@crm.dev',
        passwordHash: hash,
        role: 'member',
        crmRole: 'hiring_manager',
      },
      {
        name: 'Dave Viewer',
        email: 'viewer@crm.dev',
        passwordHash: hash,
        role: 'member',
        crmRole: 'viewer',
      },
    ])
    .returning();

  await db.insert(teamMembers).values([
    { teamId: team.id, userId: admin.id, role: 'owner' },
    { teamId: team.id, userId: recruiter.id, role: 'member' },
    { teamId: team.id, userId: hiringManager.id, role: 'member' },
    { teamId: team.id, userId: viewer.id, role: 'member' },
  ]);

  console.log('DONE: Users & team created');

  // Clients

  const [clientA, clientB, clientC] = await db
    .insert(clients)
    .values([
      {
        teamId: team.id,
        name: 'Acme Corp',
        industry: 'FinTech',
        website: 'https://acme.example.com',
        status: 'active',
        assignedUserId: recruiter.id,
      },
      {
        teamId: team.id,
        name: 'Nova Systems',
        industry: 'SaaS',
        website: 'https://nova.example.com',
        status: 'active',
        assignedUserId: recruiter.id,
      },
      {
        teamId: team.id,
        name: 'Bright Future Ltd',
        industry: 'E-commerce',
        website: 'https://brightfuture.example.com',
        status: 'prospect',
        assignedUserId: admin.id,
      },
    ])
    .returning();

  await db.insert(clientContacts).values([
    {
      clientId: clientA.id,
      name: 'John Smith',
      email: 'jsmith@acme.example.com',
      phone: '+1-555-0101',
      position: 'CTO',
      isPrimary: true,
    },
    {
      clientId: clientA.id,
      name: 'Sarah Lee',
      email: 'slee@acme.example.com',
      position: 'HR Director',
      isPrimary: false,
    },
    {
      clientId: clientB.id,
      name: 'Mike Johnson',
      email: 'mjohnson@nova.example.com',
      phone: '+1-555-0202',
      position: 'VP Engineering',
      isPrimary: true,
    },
    {
      clientId: clientC.id,
      name: 'Emma Brown',
      email: 'ebrown@brightfuture.example.com',
      position: 'Head of Talent',
      isPrimary: true,
    },
  ]);

  console.log('DONE: Clients & contacts created');

  // Vacancies

  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [v1, v2, v3, v4, v5] = await db
    .insert(vacancies)
    .values([
      {
        teamId: team.id,
        clientId: clientA.id,
        title: 'Senior React Developer',
        description: 'Looking for an experienced React developer to join the frontend team.',
        techStack: 'React, TypeScript, Next.js, GraphQL',
        seniority: 'senior',
        salaryMin: 5000,
        salaryMax: 8000,
        currency: 'USD',
        location: 'Remote',
        workType: 'remote',
        status: 'open',
        priority: 'high',
        assignedRecruiterId: recruiter.id,
        hiringManagerId: hiringManager.id,
        deadlineAt: inTwoWeeks,
      },
      {
        teamId: team.id,
        clientId: clientA.id,
        title: 'Backend Engineer (Node.js)',
        description: 'Node.js engineer needed for microservices architecture.',
        techStack: 'Node.js, PostgreSQL, Docker, Kubernetes',
        seniority: 'middle',
        salaryMin: 3500,
        salaryMax: 6000,
        currency: 'USD',
        location: 'Kyiv / Remote',
        workType: 'hybrid',
        status: 'open',
        priority: 'medium',
        assignedRecruiterId: recruiter.id,
        hiringManagerId: hiringManager.id,
        deadlineAt: inOneMonth,
      },
      {
        teamId: team.id,
        clientId: clientB.id,
        title: 'Product Manager',
        description: 'Experienced PM for a B2B SaaS product.',
        techStack: 'Product Strategy, Jira, Figma, Analytics',
        seniority: 'senior',
        salaryMin: 4000,
        salaryMax: 7000,
        currency: 'USD',
        location: 'Warsaw',
        workType: 'onsite',
        status: 'open',
        priority: 'high',
        assignedRecruiterId: recruiter.id,
        hiringManagerId: admin.id,
        deadlineAt: inTwoWeeks,
      },
      {
        teamId: team.id,
        clientId: clientB.id,
        title: 'DevOps Engineer',
        description: 'CI/CD and infrastructure management.',
        techStack: 'AWS, Terraform, GitHub Actions, Docker',
        seniority: 'middle',
        salaryMin: 4000,
        salaryMax: 6500,
        currency: 'USD',
        location: 'Remote',
        workType: 'remote',
        status: 'on_hold',
        priority: 'low',
        assignedRecruiterId: recruiter.id,
        deadlineAt: inOneMonth,
      },
      {
        teamId: team.id,
        clientId: clientC.id,
        title: 'Junior QA Engineer',
        description: 'Manual and automation QA for e-commerce platform.',
        techStack: 'Selenium, Cypress, Postman',
        seniority: 'junior',
        salaryMin: 1500,
        salaryMax: 2500,
        currency: 'USD',
        location: 'Lviv',
        workType: 'hybrid',
        status: 'filled',
        priority: 'medium',
        assignedRecruiterId: admin.id,
      },
    ])
    .returning();

  console.log('DONE: Vacancies created');

  // Candidates

  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = await db
    .insert(candidates)
    .values([
      {
        teamId: team.id,
        firstName: 'Oleksiy',
        lastName: 'Kovalenko',
        email: 'o.kovalenko@gmail.com',
        phone: '+380501234567',
        location: 'Kyiv, Ukraine',
        techStack: 'React, TypeScript, Next.js, Redux',
        seniority: 'senior',
        salaryExpectation: 7000,
        currency: 'USD',
        noticePeriod: '2 weeks',
        linkedinUrl: 'https://linkedin.com/in/okovalenko',
        status: 'active',
        source: 'LinkedIn',
      },
      {
        teamId: team.id,
        firstName: 'Inna',
        lastName: 'Petrenko',
        email: 'inna.petrenko@gmail.com',
        location: 'Lviv, Ukraine',
        techStack: 'React, JavaScript, CSS, Storybook',
        seniority: 'middle',
        salaryExpectation: 4500,
        currency: 'USD',
        noticePeriod: '1 month',
        status: 'active',
        source: 'Referral',
      },
      {
        teamId: team.id,
        firstName: 'Dmytro',
        lastName: 'Savchuk',
        email: 'd.savchuk@ukr.net',
        location: 'Kharkiv, Ukraine',
        techStack: 'Node.js, Express, PostgreSQL, Redis',
        seniority: 'senior',
        salaryExpectation: 6000,
        currency: 'USD',
        noticePeriod: 'Immediately',
        linkedinUrl: 'https://linkedin.com/in/dsavchuk',
        status: 'active',
        source: 'Djinni',
      },
      {
        teamId: team.id,
        firstName: 'Maria',
        lastName: 'Tkachenko',
        email: 'maria.t@gmail.com',
        location: 'Remote',
        techStack: 'Node.js, NestJS, TypeScript, MongoDB',
        seniority: 'middle',
        salaryExpectation: 5000,
        currency: 'USD',
        noticePeriod: '2 weeks',
        status: 'active',
        source: 'LinkedIn',
      },
      {
        teamId: team.id,
        firstName: 'Andrii',
        lastName: 'Lysenko',
        email: 'andrii.l@proton.me',
        location: 'Warsaw, Poland',
        techStack: 'AWS, Terraform, Kubernetes, Docker',
        seniority: 'senior',
        salaryExpectation: 7500,
        currency: 'USD',
        noticePeriod: '1 month',
        status: 'active',
        source: 'LinkedIn',
      },
      {
        teamId: team.id,
        firstName: 'Olena',
        lastName: 'Bondarenko',
        email: 'o.bondarenko@gmail.com',
        location: 'Kyiv, Ukraine',
        techStack: 'Product Management, Agile, Jira, Figma',
        seniority: 'senior',
        salaryExpectation: 6500,
        currency: 'USD',
        noticePeriod: '3 weeks',
        linkedinUrl: 'https://linkedin.com/in/obondarenko',
        status: 'active',
        source: 'Referral',
      },
      {
        teamId: team.id,
        firstName: 'Taras',
        lastName: 'Melnyk',
        email: 'taras.m@gmail.com',
        location: 'Ivano-Frankivsk, Ukraine',
        techStack: 'React, Vue.js, JavaScript',
        seniority: 'junior',
        salaryExpectation: 2000,
        currency: 'USD',
        noticePeriod: 'Immediately',
        status: 'active',
        source: 'Djinni',
      },
      {
        teamId: team.id,
        firstName: 'Vira',
        lastName: 'Sydorenko',
        email: 'vira.s@ukr.net',
        location: 'Lviv, Ukraine',
        techStack: 'Selenium, Cypress, Postman, SQL',
        seniority: 'junior',
        salaryExpectation: 2200,
        currency: 'USD',
        noticePeriod: 'Immediately',
        status: 'placed',
        source: 'LinkedIn',
      },
      {
        teamId: team.id,
        firstName: 'Ruslan',
        lastName: 'Horobets',
        email: 'ruslan.h@gmail.com',
        location: 'Dnipro, Ukraine',
        techStack: 'React, TypeScript, GraphQL',
        seniority: 'middle',
        salaryExpectation: 4000,
        currency: 'USD',
        noticePeriod: '2 weeks',
        status: 'passive',
        source: 'Cold Outreach',
      },
      {
        teamId: team.id,
        firstName: 'Natalia',
        lastName: 'Kravets',
        email: 'n.kravets@gmail.com',
        location: 'Berlin, Germany',
        techStack: 'AWS, GCP, CI/CD, Terraform',
        seniority: 'middle',
        salaryExpectation: 6000,
        currency: 'USD',
        noticePeriod: '1 month',
        linkedinUrl: 'https://linkedin.com/in/nkravets',
        status: 'active',
        source: 'LinkedIn',
      },
    ])
    .returning();

  console.log('DONE: Candidates created');

  // Submissions & Pipeline History

  // Submission 1: Oleksiy -> Senior React Dev @ Acme - at tech_interview
  const [sub1] = await db
    .insert(submissions)
    .values({
      vacancyId: v1.id,
      candidateId: c1.id,
      submittedBy: recruiter.id,
      currentStage: 'tech_interview',
      notes: 'Strong profile, passed HR screen well.',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub1.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub1.id, fromStage: 'sourced', toStage: 'screening', changedBy: recruiter.id },
    { submissionId: sub1.id, fromStage: 'screening', toStage: 'hr_interview', changedBy: recruiter.id },
    { submissionId: sub1.id, fromStage: 'hr_interview', toStage: 'tech_interview', changedBy: recruiter.id, notes: 'HR approved, moving to tech round' },
  ]);

  // Submission 2: Inna -> Senior React Dev @ Acme - at screening
  const [sub2] = await db
    .insert(submissions)
    .values({
      vacancyId: v1.id,
      candidateId: c2.id,
      submittedBy: recruiter.id,
      currentStage: 'screening',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub2.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub2.id, fromStage: 'sourced', toStage: 'screening', changedBy: recruiter.id },
  ]);

  // Submission 3: Dmytro -> Backend Engineer @ Acme - at client_interview
  const [sub3] = await db
    .insert(submissions)
    .values({
      vacancyId: v2.id,
      candidateId: c3.id,
      submittedBy: recruiter.id,
      currentStage: 'client_interview',
      notes: 'Excellent technical skills.',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub3.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub3.id, fromStage: 'sourced', toStage: 'hr_interview', changedBy: recruiter.id },
    { submissionId: sub3.id, fromStage: 'hr_interview', toStage: 'tech_interview', changedBy: recruiter.id },
    { submissionId: sub3.id, fromStage: 'tech_interview', toStage: 'client_interview', changedBy: hiringManager.id },
  ]);

  // Submission 4: Maria -> Backend Engineer @ Acme - rejected
  const [sub4] = await db
    .insert(submissions)
    .values({
      vacancyId: v2.id,
      candidateId: c4.id,
      submittedBy: recruiter.id,
      currentStage: 'rejected',
      rejectionReason: 'Salary expectations exceed budget.',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub4.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub4.id, fromStage: 'sourced', toStage: 'screening', changedBy: recruiter.id },
    { submissionId: sub4.id, fromStage: 'screening', toStage: 'rejected', changedBy: recruiter.id, notes: 'Salary mismatch' },
  ]);

  // Submission 5: Olena -> Product Manager @ Nova - at offer
  const [sub5] = await db
    .insert(submissions)
    .values({
      vacancyId: v3.id,
      candidateId: c6.id,
      submittedBy: recruiter.id,
      currentStage: 'offer',
      notes: 'Client loved the candidate. Offer being prepared.',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub5.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub5.id, fromStage: 'sourced', toStage: 'screening', changedBy: recruiter.id },
    { submissionId: sub5.id, fromStage: 'screening', toStage: 'hr_interview', changedBy: recruiter.id },
    { submissionId: sub5.id, fromStage: 'hr_interview', toStage: 'tech_interview', changedBy: recruiter.id },
    { submissionId: sub5.id, fromStage: 'tech_interview', toStage: 'client_interview', changedBy: recruiter.id },
    { submissionId: sub5.id, fromStage: 'client_interview', toStage: 'offer', changedBy: admin.id, notes: 'Client approved!' },
  ]);

  // Submission 6: Andrii -> DevOps @ Nova - at hr_interview
  const [sub6] = await db
    .insert(submissions)
    .values({
      vacancyId: v4.id,
      candidateId: c5.id,
      submittedBy: recruiter.id,
      currentStage: 'hr_interview',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub6.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
    { submissionId: sub6.id, fromStage: 'sourced', toStage: 'screening', changedBy: recruiter.id },
    { submissionId: sub6.id, fromStage: 'screening', toStage: 'hr_interview', changedBy: recruiter.id },
  ]);

  // Submission 7: Vira -> Junior QA @ Bright Future - hired
  const [sub7] = await db
    .insert(submissions)
    .values({
      vacancyId: v5.id,
      candidateId: c8.id,
      submittedBy: admin.id,
      currentStage: 'hired',
      notes: 'Placement successful.',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub7.id, fromStage: null, toStage: 'sourced', changedBy: admin.id },
    { submissionId: sub7.id, fromStage: 'sourced', toStage: 'hr_interview', changedBy: admin.id },
    { submissionId: sub7.id, fromStage: 'hr_interview', toStage: 'client_interview', changedBy: admin.id },
    { submissionId: sub7.id, fromStage: 'client_interview', toStage: 'offer', changedBy: admin.id },
    { submissionId: sub7.id, fromStage: 'offer', toStage: 'hired', changedBy: admin.id, notes: 'Candidate accepted offer' },
  ]);

  // Submission 8: Ruslan -> Senior React Dev @ Acme - sourced
  const [sub8] = await db
    .insert(submissions)
    .values({
      vacancyId: v1.id,
      candidateId: c9.id,
      submittedBy: recruiter.id,
      currentStage: 'sourced',
    })
    .returning();

  await db.insert(pipelineHistory).values([
    { submissionId: sub8.id, fromStage: null, toStage: 'sourced', changedBy: recruiter.id },
  ]);

  console.log('DONE: Submissions & pipeline history created');
  console.log('');
  console.log(' Seed complete!');
  console.log('');
  console.log('Demo credentials (password for all: password123):');
  console.log('  admin@crm.dev         -> Admin');
  console.log('  recruiter@crm.dev     -> Recruiter');
  console.log('  manager@crm.dev       -> Hiring Manager');
  console.log('  viewer@crm.dev        -> Viewer');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });