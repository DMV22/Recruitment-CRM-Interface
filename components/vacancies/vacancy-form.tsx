'use client';

import { useActionState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { createVacancyAction, updateVacancyAction, type VacancyFormState } from '@/app/(dashboard)/vacancies/actions';

type VacancyFormClient = {
  id: number;
  title: string;
  clientId: number;
  description: string | null;
  techStack: string | null;
  seniority: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal' | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  workType: 'remote' | 'hybrid' | 'onsite';
  status: 'open' | 'on_hold' | 'closed' | 'filled';
  priority: 'low' | 'medium' | 'high';
  assignedRecruiterId: number | null;
  hiringManagerId: number | null;
  deadlineAt: Date | null;
};

type SelectOption = {
  id: number;
  name: string | null;
};

type ClientOption = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  vacancy?: VacancyFormClient | null;
  clients: ClientOption[];
  recruiters?: SelectOption[];
  hiringManagers?: SelectOption[];
};

const initialState: VacancyFormState = {};

function formatDateInput(date: Date | null | undefined) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function VacancyForm({
  open,
  onClose,
  vacancy,
  clients,
  recruiters = [],
  hiringManagers = [],
}: Props) {
  const isEdit = !!vacancy;

  const action = isEdit
    ? updateVacancyAction.bind(null, vacancy.id)
    : createVacancyAction;

  const [state, formAction, isPending] = useActionState<VacancyFormState, FormData>(
    action,
    initialState
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Vacancy' : 'New Vacancy'}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={vacancy?.title ?? ''}
              placeholder="Senior Frontend Engineer"
              aria-invalid={!!state.fieldErrors?.title}
            />
            {state.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">
              Client <span className="text-destructive">*</span>
            </Label>
            <Select name="clientId" defaultValue={vacancy?.clientId ? String(vacancy.clientId) : undefined}>
              <SelectTrigger id="clientId" aria-invalid={!!state.fieldErrors?.clientId}>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.clientId && (
              <p className="text-xs text-destructive">{state.fieldErrors.clientId[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={vacancy?.status ?? 'open'}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue={vacancy?.priority ?? 'medium'}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workType">Work type</Label>
            <Select name="workType" defaultValue={vacancy?.workType ?? 'remote'}>
              <SelectTrigger id="workType">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">Onsite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seniority">Seniority</Label>
            <Select name="seniority" defaultValue={vacancy?.seniority ?? undefined}>
              <SelectTrigger id="seniority">
                <SelectValue placeholder="Select seniority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="principal">Principal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="techStack">Tech stack</Label>
            <Input
              id="techStack"
              name="techStack"
              defaultValue={vacancy?.techStack ?? ''}
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salaryMin">Salary min</Label>
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              defaultValue={vacancy?.salaryMin ?? ''}
              placeholder="2000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salaryMax">Salary max</Label>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              defaultValue={vacancy?.salaryMax ?? ''}
              placeholder="4000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={vacancy?.currency ?? 'USD'}
              placeholder="USD"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={vacancy?.location ?? ''}
              placeholder="Kyiv"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignedRecruiterId">Assigned recruiter</Label>
            <Select
              name="assignedRecruiterId"
              defaultValue={
                vacancy?.assignedRecruiterId ? String(vacancy.assignedRecruiterId) : 'unassigned'
              }
            >
              <SelectTrigger id="assignedRecruiterId">
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {recruiters.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name ?? `User #${user.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hiringManagerId">Hiring manager</Label>
            <Select
              name="hiringManagerId"
              defaultValue={
                vacancy?.hiringManagerId ? String(vacancy.hiringManagerId) : 'unassigned'
              }
            >
              <SelectTrigger id="hiringManagerId">
                <SelectValue placeholder="Select hiring manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {hiringManagers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name ?? `User #${user.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadlineAt">Deadline</Label>
            <Input
              id="deadlineAt"
              name="deadlineAt"
              type="date"
              defaultValue={formatDateInput(vacancy?.deadlineAt)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={vacancy?.description ?? ''}
              placeholder="Role responsibilities, requirements, interview stages..."
              rows={5}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
          )}

          <div className="flex gap-3 pt-2 md:col-span-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create vacancy'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}