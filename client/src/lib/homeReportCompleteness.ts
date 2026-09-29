const REPORT_RELEVANT_OPTIONAL_FIELDS = new Set([
  "suiteToilets", "suiteSinks", "suiteShowers", "suiteBathtubs", "suiteWashers",
  "propertyToilets", "propertySinks", "propertyShowers", "propertyBathtubs", "propertyWashers", "propertyDishwashers",
  "hasKitchenGFCI", "hasBathroomGFCI", "hasBedroomAFCI", "hasSubPanel", "serviceAmps",
]);

const PLUMBING_REPORT_FIELDS = new Set([
  "suiteToilets", "suiteSinks", "suiteShowers", "suiteBathtubs", "suiteWashers",
  "propertyToilets", "propertySinks", "propertyShowers", "propertyBathtubs", "propertyWashers", "propertyDishwashers",
]);

const ELECTRICAL_REPORT_FIELDS = new Set(["hasKitchenGFCI", "hasBathroomGFCI", "hasBedroomAFCI", "hasSubPanel", "serviceAmps"]);

export function getReportRelevantBlankSummary(visibleFieldKeys: string[], answers: Record<string, unknown>) {
  const blankKeys = visibleFieldKeys.filter((key) =>
    REPORT_RELEVANT_OPTIONAL_FIELDS.has(key) && (answers[key] === undefined || answers[key] === "")
  );
  const affectedUnresolvedChecks =
    (blankKeys.some((key) => PLUMBING_REPORT_FIELDS.has(key)) ? 4 : 0) +
    [...ELECTRICAL_REPORT_FIELDS].filter((key) => blankKeys.includes(key)).length;
  return { blankKeys, blankCount: blankKeys.length, affectedUnresolvedChecks };
}
