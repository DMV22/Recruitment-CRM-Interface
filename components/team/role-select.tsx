'use client';

import { useTransition } from 'react';
import { changeUserRoleAction } from '@/app/(dashboard)/team/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CrmRole } from '@/lib/rbac';

type Props = {
  userId: number;
  value: CrmRole;
  disabled?: boolean;
};

export function RoleSelect({ userId, value, disabled }: Props) {
  const [pending, startTransition] = useTransition();

  const handleRoleChange = (nextValue: string) => {
    const formData = new FormData();
    formData.set('userId', String(userId));
    formData.set('crmRole', nextValue);

    startTransition(async () => {
      // Error handling: Retrieving the result of the Server Action
      const result = await changeUserRoleAction({}, formData);

      if (result?.error) {
        // If the server rejected the mutation (for example, self-demotion or IDOR)
        alert(result.error);
      }
    });
  };

  return (
    <Select
      name="crmRole"
      defaultValue={value}
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
    </Select>
  );
}
