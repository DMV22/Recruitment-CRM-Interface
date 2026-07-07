import { z } from 'zod';

/**
 * Універсальний хелпер для валідації FormData за допомогою будь-якої Zod-схеми.
 * Автоматично збирає поля форми в об'єкт та виводить правильні TypeScript типи.
 */
export function validateForm<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T
): z.SafeParseReturnType<z.infer<T>, z.infer<T>> {
  const raw = Object.fromEntries(formData.entries());

  return schema.safeParse(raw);
}
