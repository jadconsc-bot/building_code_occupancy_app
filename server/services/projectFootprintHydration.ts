import { and, eq } from 'drizzle-orm';
import { projects } from '../../drizzle/schema';

export async function hydrateFootprintInput<T extends Record<string, any>>(
  db: any,
  userId: number,
  projectId: number | undefined,
  inputs: T,
): Promise<T & { footprint_m2?: number }> {
  if (!projectId) return inputs;
  const [project] = await db
    .select({ buildingFootprintJson: projects.buildingFootprintJson })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  const fact = project?.buildingFootprintJson as { value?: unknown } | null | undefined;
  const value = typeof fact?.value === 'number' && Number.isFinite(fact.value) && fact.value >= 0
    ? fact.value
    : undefined;
  return value === undefined ? inputs : { ...inputs, footprint_m2: value };
}
