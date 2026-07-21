'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { changeUserRoleAction } from '@/app/(dashboard)/team/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CrmRole } from '@/lib/rbac';
import { AlertCircle, Loader2 } from 'lucide-react';

type Props = {
  userId: number;
  value: CrmRole;
  disabled?: boolean;
};

export function RoleSelect({ userId, value, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Optimistic state: initialized with the 'value' prop from the server
  const [optimisticRole, setOptimisticRole] = useOptimistic<CrmRole, CrmRole>(
    value,
    (_, nextRole) => nextRole
  );

  const handleRoleChange = (nextValue: string) => {
    const nextRole = nextValue as CrmRole;
    setError(null);

    const formData = new FormData();
    formData.set('userId', String(userId));
    formData.set('crmRole', nextValue);

    startTransition(async () => {
      // Change the UI on the client instantly
      setOptimisticRole(nextRole);

      // Error handling: Retrieving the result of the Server Action
      const result = await changeUserRoleAction({}, formData);

      if (result?.error) {
        // If the server rejected the mutation (for example, self-demotion or IDOR)
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Select
          name="crmRole"
          value={optimisticRole}
          disabled={disabled || pending}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs font-medium">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="recruiter">Recruiter</SelectItem>
            <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>

          {/* A smooth indicator showing that the role is saved on the server */}
          {pending && <Loader2 className="spinner" />}
        </Select>
      </div>

      {error && (
        <p className="form-error">
          <AlertCircle className="icon-xs" />
          {error}
        </p>
      )}
    </div>
  );
}
