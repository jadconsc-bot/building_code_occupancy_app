import { trpc } from "@/lib/trpc";
import type { AreaUnit } from "@/lib/areaUnits";

export function useAreaUnitPreference() {
  const utils = trpc.useUtils();
  const query = trpc.user.getAreaUnit.useQuery();
  const mutation = trpc.user.setAreaUnit.useMutation({
    onSuccess: () => utils.user.getAreaUnit.invalidate(),
  });
  const areaUnit: AreaUnit = query.data?.areaUnit === "ft2" ? "ft2" : "m2";
  return { areaUnit, setAreaUnit: (next: AreaUnit) => mutation.mutate({ areaUnit: next }), isLoading: query.isLoading || mutation.isPending };
}
