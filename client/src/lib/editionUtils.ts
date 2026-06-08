/**
 * Client-side province → code edition mapping.
 * Mirrors server/rules/overlays/index.ts editionForProvince without pulling in server code.
 */
export function editionForProvince(province: string): string {
  const map: Record<string, string> = {
    AB: 'NBC(AE) 2023',
    BC: 'BCBC 2024',
    ON: 'OBC 2012',
    QC: 'CCQ 2015',
  };
  return map[province] ?? 'NBC 2020';
}
