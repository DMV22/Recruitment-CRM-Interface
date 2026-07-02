'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import {
  createCandidateAction,
  updateCandidateAction,
  type CandidateFormState,
} from '@/app/(dashboard)/candidates/actions';

type CandidateFormData = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  techStack: string | null;
  seniority: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal' | null;
  salaryExpectation: number | null;
  currency: string;
  noticePeriod: string | null;
  linkedinUrl: string | null;
  status: 'active' | 'passive' | 'placed' | 'blacklisted';
  source: string | null;
  notes: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  candidate?: CandidateFormData | null;
};

const initialState: CandidateFormState = {};

const SENIORITY_OPTIONS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'passive', label: 'Passive' },
  { value: 'placed', label: 'Placed' },
  { value: 'blacklisted', label: 'Blacklisted' },
];

export function CandidateForm({ open, onClose, candidate }: Props) {
  const isEdit = !!candidate;

  const action = isEdit ? updateCandidateAction.bind(null, candidate.id) : createCandidateAction;

  const [state, formAction, isPending] = useActionState<CandidateFormState, FormData>(
    action,
    initialState
  );

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (state.success) onCloseRef.current();
  }, [state.success]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Candidate' : 'New Candidate'}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="form-grid">
          {/* First Name */}
          <div className="form-field">
            <Label htmlFor="firstName">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={candidate?.firstName ?? ''}
              placeholder="John"
              aria-invalid={!!state.fieldErrors?.firstName}
            />
            {state.fieldErrors?.firstName && (
              <p className="form-error">{state.fieldErrors.firstName[0]}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="form-field">
            <Label htmlFor="lastName">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={candidate?.lastName ?? ''}
              placeholder="Doe"
              aria-invalid={!!state.fieldErrors?.lastName}
            />
            {state.fieldErrors?.lastName && (
              <p className="form-error">{state.fieldErrors.lastName[0]}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-field">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={candidate?.email ?? ''}
              placeholder="john@example.com"
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && <p className="form-error">{state.fieldErrors.email[0]}</p>}
          </div>

          {/* Phone */}
          <div className="form-field">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={candidate?.phone ?? ''}
              placeholder="+380 50 000 0000"
            />
          </div>

          {/* Location */}
          <div className="form-field">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={candidate?.location ?? ''}
              placeholder="Kyiv, Ukraine"
            />
          </div>

          {/* LinkedIn */}
          <div className="form-field">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={candidate?.linkedinUrl ?? ''}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {/* Seniority */}
          <div className="form-field">
            <Label htmlFor="seniority">Seniority</Label>
            <Select name="seniority" defaultValue={candidate?.seniority ?? undefined}>
              <SelectTrigger className="w-full" id="seniority">
                <SelectValue placeholder="Select seniority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {SENIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="form-field">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={candidate?.status ?? 'active'}>
              <SelectTrigger className="w-full" id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="form-field">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={candidate?.status ?? 'active'}>
              <SelectTrigger className="w-full" id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="passive">Passive</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Salary Expectation */}
          <div className="form-field">
            <Label htmlFor="salaryExpectation">Salary expectation</Label>
            <Input
              id="salaryExpectation"
              name="salaryExpectation"
              type="number"
              min={0}
              defaultValue={candidate?.salaryExpectation ?? ''}
              placeholder="3000"
            />
            {state.fieldErrors?.salaryExpectation && (
              <p className="form-error">{state.fieldErrors.salaryExpectation[0]}</p>
            )}
          </div>

          {/* Currency */}
          <div className="form-field">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={candidate?.currency ?? 'USD'}
              placeholder="USD"
            />
          </div>

          {/* Notice Period */}
          <div className="form-field">
            <Label htmlFor="noticePeriod">Notice period</Label>
            <Input
              id="noticePeriod"
              name="noticePeriod"
              defaultValue={candidate?.noticePeriod ?? ''}
              placeholder="2 weeks"
            />
          </div>

          {/* Source */}
          <div className="form-field">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              defaultValue={candidate?.source ?? ''}
              placeholder="LinkedIn, Referral..."
            />
          </div>

          {/* Tech Stack */}
          <div className="form-field-wide">
            <Label htmlFor="techStack">Tech stack</Label>
            <Input
              id="techStack"
              name="techStack"
              defaultValue={candidate?.techStack ?? ''}
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          {/* Notes */}
          <div className="form-field-wide">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={candidate?.notes ?? ''}
              placeholder="Additional information..."
              rows={4}
            />
          </div>

          {state.error && <p className="form-error-block form-field-wide">{state.error}</p>}

          <div className="form-footer form-field-wide">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="spinner" />}
              {isEdit ? 'Save changes' : 'Create candidate'}
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
