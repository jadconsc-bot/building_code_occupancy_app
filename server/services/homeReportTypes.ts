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

export function groupComplianceItems(items: HomeReportComplianceItem[]) {
  const resolved = items
    .filter((item) => item.result === "pass" || item.result === "fail")
    .sort((a, b) => Number(b.result === "fail") - Number(a.result === "fail"));
  const needsInput = items.filter((item) => item.result === "conditional");
  const notApplicable = items.filter((item) => item.result === "not_applicable");
  return { resolved, needsInput, notApplicable };
}
