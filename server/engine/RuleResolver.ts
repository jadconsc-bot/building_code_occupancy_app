import { getDb } from '../db';
import { jurisdictionProfiles } from '../../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { EvaluationContext } from './types/context';

export interface ResolvedRule {
  value: number | string | boolean;
  unit: string;
  ref: string;
  source: string;         // "NBC 2020 Federal" | "ABC 2023 Provincial" | etc.
  layer: 'federal' | 'provincial' | 'municipal' | 'project';
  overrideChain: {
    layer: 'federal' | 'provincial' | 'municipal' | 'project';
    source: string | null;
    value: number | string | boolean | null;
    applied: boolean;
  }[];
}

interface AmendmentOverride {
  nbcSection: string;
  category: string;
  description: string;
  overrideType: 'modify' | 'add' | 'remove' | 'replace';
  amendedValue?: number;
  amendedUnit?: string;
  notes?: string;
}

interface AmendmentData {
  overrides: AmendmentOverride[];
  additions: any[];
  removals: any[];
}

export class RuleResolver {

  async resolveConstraint(
    nbcSection: string,
    federalValue: number | string | boolean,
    federalUnit: string,
    federalRef: string,
    context: EvaluationContext,
  ): Promise<ResolvedRule> {

    // Build override chain starting with federal baseline
    const chain: ResolvedRule['overrideChain'] = [
      {
        layer: 'federal',
        source: 'NBC 2020',
        value: federalValue,
        applied: true,  // assume federal applies unless overridden
      },
      { layer: 'provincial', source: null, value: null, applied: false },
      { layer: 'municipal',  source: null, value: null, applied: false },
      { layer: 'project',    source: null, value: null, applied: false },
    ];

    let resolvedValue = federalValue;
    let resolvedUnit  = federalUnit;
    let resolvedSource: string = 'NBC 2020 Federal';
    let resolvedLayer: ResolvedRule['layer'] = 'federal';

    // Layer 2 — Provincial override
    if (context.jurisdiction.province) {
      const db = await getDb();
      if (!db) return { value: resolvedValue, unit: resolvedUnit, ref: federalRef, source: resolvedSource, layer: resolvedLayer, overrideChain: chain };
      const jurisdiction = await db
        .select()
        .from(jurisdictionProfiles)
        .where(
          and(
            eq(jurisdictionProfiles.province, context.jurisdiction.province as any),
            isNull(jurisdictionProfiles.municipality),
          ),
        )
        .limit(1);

      if (jurisdiction[0]?.localAmendments) {
        try {
          const amendments: AmendmentData = JSON.parse(
            jurisdiction[0].localAmendments as string,
          );

          const override = amendments.overrides?.find(
            (o: AmendmentOverride) => o.nbcSection === nbcSection,
          );

          if (override && override.overrideType !== 'add') {
            if (override.overrideType === 'remove') {
              chain[0].applied = false;
              chain[1] = {
                layer: 'provincial',
                source: context.jurisdiction.codeEdition,
                value: 'removed',
                applied: true,
              };
              resolvedValue  = 'not_applicable';
              resolvedSource = `${context.jurisdiction.codeEdition} Provincial`;
              resolvedLayer  = 'provincial';
            } else if (override.amendedValue !== undefined) {
              chain[0].applied = false;
              chain[1] = {
                layer: 'provincial',
                source: context.jurisdiction.codeEdition,
                value: override.amendedValue,
                applied: true,
              };
              resolvedValue  = override.amendedValue;
              resolvedUnit   = override.amendedUnit ?? federalUnit;
              resolvedSource = `${context.jurisdiction.codeEdition} Provincial`;
              resolvedLayer  = 'provincial';
            }
          } else {
            // No provincial override — federal applies
            chain[1] = {
              layer: 'provincial',
              source: context.jurisdiction.codeEdition,
              value: null,
              applied: false,
            };
          }
        } catch (_e) {
          // Invalid JSON in amendments — fall through to federal
        }
      }
    }

    // Layer 3 — Municipal override (Phase 3 — placeholder)
    // chain[2] remains { layer: 'municipal', source: null, value: null, applied: false }

    // Layer 4 — Project override (Phase 3 — for alternative solutions)
    // chain[3] remains { layer: 'project', source: null, value: null, applied: false }

    return {
      value: resolvedValue,
      unit: resolvedUnit,
      ref: federalRef,
      source: resolvedSource,
      layer: resolvedLayer,
      overrideChain: chain,
    };
  }
}

export const ruleResolver = new RuleResolver();
