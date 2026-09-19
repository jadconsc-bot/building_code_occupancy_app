import { and, eq } from 'drizzle-orm';
import { projects } from '../../drizzle/schema';
import { readProvenancedFact } from './factProvenance';

export async function hydrateFootprintInput<T extends Record<string, any>>(
  db: any,
  userId: number,
  projectId: number | undefined,
  inputs: T,
): Promise<T & { footprint_m2?: number; totalDwellingUnits?: number }> {
  if (!projectId) return inputs;
  const [project] = await db
    .select({ buildingFootprintJson: projects.buildingFootprintJson, totalDwellingUnits: projects.totalDwellingUnits, totalDwellingUnitsJson: projects.totalDwellingUnitsJson })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  const value = readProvenancedFact({ wrapper: project?.buildingFootprintJson, scalar: null, field: 'buildingFootprintJson', entityType: 'project', entityId: projectId, isValue: (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 }).value ?? undefined;
  const units = readProvenancedFact({ wrapper: project?.totalDwellingUnitsJson, scalar: project?.totalDwellingUnits, field: 'totalDwellingUnits', entityType: 'project', entityId: projectId, isValue: (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 }).value ?? undefined;
  return { ...inputs, ...(value === undefined ? {} : { footprint_m2: value }), ...(units === undefined || inputs.totalDwellingUnits !== undefined ? {} : { totalDwellingUnits: units }) };
}
