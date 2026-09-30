export const POSITIVE_HOME_FIELDS = ["limitingDistanceM", "exposingFaceAreaM2"] as const;

const LABELS: Record<string, string> = {
  limitingDistanceM: "Limiting distance",
  exposingFaceAreaM2: "Exposing face area",
};

export function parseHomeNumberInput(value: string): number | string {
  return value === "" ? "" : parseFloat(value);
}

export function getNonPositiveHomeFields(answers: Record<string, unknown>): string[] {
  return POSITIVE_HOME_FIELDS
    .filter((key) => {
      const value = answers[key];
      if (value === undefined || value === "") return false;
      const number = typeof value === "number" ? value : Number(value);
      return !Number.isFinite(number) || number <= 0;
    })
    .map((key) => LABELS[key]);
}
