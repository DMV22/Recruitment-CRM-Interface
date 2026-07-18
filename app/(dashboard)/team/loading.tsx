import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TeamLoadingPage() {
  return (
    <div className="page-content space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="page-header">
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="h-4 w-96 rounded-md bg-muted mt-2" />
      </div>

      {/* 1. Team Members Table Skeleton */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Team members</CardTitle>
          <CardDescription className="panel-subtitle">
            Manage access, CRM roles, and team membership.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            {/* Header row simulation */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3.5 border-b border-border bg-muted/20">
              <div className="h-4 w-16 rounded bg-muted/60" />
              <div className="h-4 w-12 rounded bg-muted/60" />
              <div className="h-4 w-16 rounded bg-muted/60" />
              <div className="h-4 w-14 rounded bg-muted/60" />
            </div>

            {/* Data rows simulation */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-4 px-6 py-4 items-center border-b border-border last:border-0"
              >
                {/* Member column (avatar + text) */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-3 w-36 rounded bg-muted" />
                  </div>
                </div>
                {/* Role column */}
                <div className="h-8 w-32 rounded bg-muted" />
                {/* Joined column */}
                <div className="h-4 w-24 rounded bg-muted" />
                {/* Status + Actions column */}
                <div className="flex items-center justify-between">
                  <div className="h-5 w-14 rounded bg-muted" />
                  {i > 0 && <div className="h-8 w-8 rounded bg-muted/40" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Pending Invitations Empty State Skeleton */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Pending invitations</CardTitle>
          <CardDescription className="panel-subtitle">
            Users who have been invited but have not joined yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="h-6 w-6 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted mt-1" />
            <div className="h-3 w-64 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Invite Member Form Skeleton */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Invite member</CardTitle>
          <CardDescription className="panel-subtitle">
            Send an invitation and assign a CRM role before the user joins the team.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="team-invite-form">
            {/* Email Field Skeleton */}
            <div className="team-form-field">
              <div className="h-4 w-12 rounded bg-muted mb-2" />
              <div className="h-10 w-full rounded-md bg-muted" />
            </div>
            {/* Role Select Skeleton */}
            <div className="team-form-field">
              <div className="h-4 w-16 rounded bg-muted mb-2" />
              <div className="h-10 w-full rounded-md bg-muted" />
            </div>
            {/* Button Footer Skeleton */}
            <div className="team-form-footer mt-2">
              <div className="h-10 w-36 rounded-md bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
