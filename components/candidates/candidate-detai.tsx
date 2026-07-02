'use client';

import { MapPin, Linkedin, Coins, Clock, User2, FileText } from 'lucide-react';

import type { Candidate } from '@/lib/db/schema';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateStatusBadge } from '@/components/candidates/candidate-status-badge';
import { SENIORITY_OPTIONS } from '@/components/candidates/candidate-form';

type Props = {
  candidate: Omit<Candidate, 'id' | 'teamId'>;
};

function formatSalary(expectation: number | null, currency: string) {
  if (expectation == null) return '—';
  return `${expectation.toLocaleString()} ${currency}`;
}

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(date));
}

export function CandidateDetail({ candidate }: Props) {
  const seniorityLabel =
    SENIORITY_OPTIONS.find((o) => o.value === candidate.seniority)?.label ?? candidate.seniority;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="detail-title">
          <h1 className="page-title-lg">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <CandidateStatusBadge status={candidate.status} />
        </div>

        <div className="vacancy-meta-row">
          {candidate.location && (
            <span className="vacancy-meta-item">
              <MapPin className="icon-md" />
              {candidate.location}
            </span>
          )}

          {candidate.seniority && (
            <span className="vacancy-meta-item">
              <User2 className="icon-md" />
              {seniorityLabel}
            </span>
          )}

          {candidate.linkedinUrl && (
            <a
              href={candidate.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vacancy-meta-item hover:text-foreground transition-colors"
            >
              <Linkedin className="icon-md" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Candidate details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="detail-field">
                <p className="detail-field-label">Email</p>
                <p className="font-medium">
                  {candidate.email ? (
                    <a href={`mailto:${candidate.email}`} className="hover:underline">
                      {candidate.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Phone</p>
                <p className="font-medium">{candidate.phone ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Tech stack</p>
                <p className="font-medium">{candidate.techStack ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Seniority</p>
                <p className="font-medium">{seniorityLabel ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Notice period</p>
                <p className="font-medium">{candidate.noticePeriod ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Source</p>
                <p className="font-medium">{candidate.source ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Added</p>
                <p className="font-medium">{formatDate(candidate.createdAt)}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Last updated</p>
                <p className="font-medium">{formatDate(candidate.updatedAt)}</p>
              </div>
            </div>

            {candidate.notes && (
              <div className="space-y-2">
                <p className="detail-field-label">Notes</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {candidate.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="detail-field">
                <p className="detail-field-label">Salary expectation</p>
                <p className="vacancy-meta-item font-medium">
                  <Coins className="icon-md text-muted-foreground" />
                  {formatSalary(candidate.salaryExpectation, candidate.currency)}
                </p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Currency</p>
                <p className="font-medium">{candidate.currency}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="snapshot-item">
                <Clock className="icon-md" />
                <span>Notice: {candidate.noticePeriod ?? '—'}</span>
              </div>

              <div className="snapshot-item">
                <FileText className="icon-md" />
                <span>
                  {candidate.linkedinUrl ? (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View LinkedIn
                    </a>
                  ) : (
                    'No LinkedIn profile'
                  )}
                </span>
              </div>

              <div className="snapshot-placeholder">
                Submission history will be added in the submissions module.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
