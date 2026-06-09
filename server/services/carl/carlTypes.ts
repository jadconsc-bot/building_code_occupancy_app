/**
 * CARL — Code Applicable Review List
 * Type definitions for the permit completeness scoring system.
 *
 * Source: https://www.calgary.ca/development/permits/carl-application-requirements.html
 * Secondary suite checklist: calgary.ca/pda/pd/documents/permit-checklists/new-secondary-suite-permit-checklist.pdf
 */

export type CARLCoverage =
  | 'full'
  | 'partial'
  | 'manual'
  | 'out_of_scope';

export type CARLStatus =
  | 'pass'
  | 'fail'
  | 'advisory'
  | 'not_evaluated'
  | 'out_of_scope';

export interface CARLItem {
  carlId: string;
  section: number;
  sectionName: string;
  description: string;
  nbcRef: string;
  jurisdiction?: string;
  engineCoverage: CARLCoverage;
  dataSource: string | null;
  blockingIfFailed: boolean;
  status: CARLStatus;
  evidence: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  recommendation: string | null;
}

export interface CARLSectionScore {
  section: number;
  sectionName: string;
  score: number;
  itemCount: number;
  passCount: number;
  failCount: number;
  advisoryCount: number;
  outOfScopeCount: number;
  hasBlockingFailure: boolean;
}

export interface CARLReport {
  projectId: number | null;
  evaluationTimestamp: string;
  codeEdition: string;
  province: string;
  jurisdictionSource?: string;
  items: CARLItem[];
  totalItems: number;
  passCount: number;
  failCount: number;
  advisoryCount: number;
  manualCount: number;
  outOfScopeCount: number;
  notEvaluatedCount: number;
  permitReadinessScore: number;
  permitReadinessLabel: 'Ready' | 'Needs Work' | 'Not Ready';
  hasBlockingFailures: boolean;
  blockingItems: CARLItem[];
  sectionScores: CARLSectionScore[];
}
