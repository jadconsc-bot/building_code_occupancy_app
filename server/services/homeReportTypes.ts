export type HomeReportRuleResult = "pass" | "conditional" | "fail";

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
