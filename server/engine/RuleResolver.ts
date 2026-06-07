import { getDb } from '../db';
import { jurisdictionProfiles } from '../../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { EvaluationContext } from './types/context';
import { getStaticOverride, editionForProvince } from '../rules/overlays/index';

export interface ResolvedRule {
  value: number | string | boolean;
  unit: string;
  ref: string;
  source: string;         // e.g. "NBC 2020 Federal" | "NBC(AE) 2023 Provincial"
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

    const province = context.jurisdiction.province;
    const edition  = context.jurisdiction.codeEdition || editionForProvince(province);

    // Build override chain starting with federal baseline
    const chain: ResolvedRule['overrideChain'] = [
      {
        layer: 'federal',
        source: 'NBC 2020',
        value: federalValue,
        applied: true,
      },
      { layer: 'provincial', source: edition || null, value: null, applied: false },
      { layer: 'municipal',  source: null, value: null, applied: false },
      { layer: 'project',    source: null, value: null, applied: false },
    ];

    let resolvedValue  = federalValue;
    let resolvedUnit   = federalUnit;
    let resolvedSource = 'NBC 2020 Federal';
    let resolvedLayer: ResolvedRule['layer'] = 'federal';

    if (!province) {
      return { value: resolvedValue, unit: resolvedUnit, ref: federalRef, source: resolvedSource, layer: resolvedLayer, overrideChain: chain };
    }

    // ── Layer 1.5: Static overlay (file-based, no DB) ────────────────────────
    // Checked before DB so the static overlay is always authoritative for known
    // provincial divergences. DB amendments (Layer 2) cover municipal/project.
    const staticOverride = getStaticOverride(province, nbcSection);
    if (staticOverride) {
      chain[0].applied = false;
      chain[1] = {
        layer: 'provincial',
        source: staticOverride.codeRef,
        value: staticOverride.overrideValue,
        applied: true,
      };
      resolvedValue  = staticOverride.overrideValue;
      resolvedUnit   = staticOverride.unit;
      resolvedSource = `${staticOverride.codeRef} Provincial`;
      resolvedLayer  = 'provincial';
      return { value: resolvedValue, unit: resolvedUnit, ref: federalRef, source: resolvedSource, layer: resolvedLayer, overrideChain: chain };
    }

    // ── Layer 2: DB-stored jurisdiction profile (provincial / municipal) ─────
    const db = await getDb();
    if (!db) {
      return { value: resolvedValue, unit: resolvedUnit, ref: federalRef, source: resolvedSource, layer: resolvedLayer, overrideChain: chain };
    }

    // Try municipality-specific profile first, fall back to province-level
    let jurisdiction = context.jurisdiction.municipality
      ? await db
          .select()
          .from(jurisdictionProfiles)
          .where(
            and(
              eq(jurisdictionProfiles.province, province as any),
              eq(jurisdictionProfiles.municipality, context.jurisdiction.municipality),
            ),
          )
          .limit(1)
      : [];

    if (jurisdiction.length === 0) {
      jurisdiction = await db
        .select()
        .from(jurisdictionProfiles)
        .where(
          and(
            eq(jurisdictionProfiles.province, province as any),
            isNull(jurisdictionProfiles.municipality),
          ),
        )
        .limit(1);
    }

    if (jurisdiction[0]) {
      console.log(
        `[RuleResolver] ${jurisdiction[0].municipality ?? 'provincial'} profile → ${jurisdiction[0].province}`,
      );
    }

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
            chain[1] = { layer: 'provincial', source: edition, value: 'removed', applied: true };
            resolvedValue  = 'not_applicable';
            resolvedSource = `${edition} Provincial`;
            resolvedLayer  = 'provincial';
          } else if (override.amendedValue !== undefined) {
            chain[0].applied = false;
            chain[1] = { layer: 'provincial', source: edition, value: override.amendedValue, applied: true };
            resolvedValue  = override.amendedValue;
            resolvedUnit   = override.amendedUnit ?? federalUnit;
            resolvedSource = `${edition} Provincial`;
            resolvedLayer  = 'provincial';
          }
        } else {
          // No numeric override, but stamp the correct edition on the chain
          chain[1] = { layer: 'provincial', source: edition, value: null, applied: false };
        }
      } catch (_e) {
        // Invalid JSON — fall through to federal, but still stamp edition
        chain[1] = { layer: 'provincial', source: edition, value: null, applied: false };
      }
    } else {
      // No DB profile — stamp edition label so chain is readable even without an override
      chain[1] = { layer: 'provincial', source: edition, value: null, applied: false };
    }

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
