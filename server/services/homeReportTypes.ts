export type HomeReportRuleResult = "pass" | "conditional" | "fail" | "not_applicable";

export interface HomeReportComplianceItem {
  ruleId: string;
  title: string;
  result: HomeReportRuleResult;
  message: string;
  whatToDo?: string;
  codeRef?: string;
}

export interface HomeReportComplianceReport {
  projectType: string;
  province: "AB" | "BC" | "ON";
  codeEdition: string;
  overallResult: HomeReportRuleResult;
  items: HomeReportComplianceItem[];
}

export interface HomeReportDiagram {
  ruleIds: string[];
  file: string;
  title: string;
}

export const HOME_REPORT_DIAGRAMS: HomeReportDiagram[] = [
  { ruleIds: ["P9-EGRESS-DIM-NATIONAL"], file: "egress-window.png", title: "Egress window clear opening" },
  { ruleIds: ["P9-WELL-PROJECTION"], file: "window-well.png", title: "Window well cross-section" },
  { ruleIds: ["P9-SPATIAL-NATIONAL", "P9-SPATIAL-INDIVIDUAL-OPENING"], file: "limiting-distance.png", title: "Spatial separation / limiting distance" },
  { ruleIds: ["P9-PLUMB-BACKWATER"], file: "backwater-valve.png", title: "Backwater valve" },
];

export function selectHomeReportDiagrams(items: HomeReportComplianceItem[]): HomeReportDiagram[] {
  return HOME_REPORT_DIAGRAMS.filter((diagram) => diagram.ruleIds.some(
    (ruleId) => items.some((item) => item.ruleId === ruleId && item.result !== "not_applicable"),
  ));
}

export function groupComplianceItems(items: HomeReportComplianceItem[]) {
  const resolved = items
    .filter((item) => item.result === "pass" || item.result === "fail")
    .sort((a, b) => Number(b.result === "fail") - Number(a.result === "fail"));
  const needsInput = items.filter((item) => item.result === "conditional");
  const notApplicable = items.filter((item) => item.result === "not_applicable");
  return { resolved, needsInput, notApplicable };
}
