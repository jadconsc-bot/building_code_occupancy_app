export function frrFromAssemblyType(assemblyType: string): number {
  if (assemblyType === "0.5hr") return 0.5;
  if (assemblyType === "1hr")   return 1;
  if (assemblyType === "1.5hr") return 1.5;
  if (assemblyType === "2hr")   return 2;
  if (assemblyType === "fire_separation") return 1;
  return 0;
}
