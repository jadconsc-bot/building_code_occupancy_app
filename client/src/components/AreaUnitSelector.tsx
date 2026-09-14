import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AreaUnit } from "@/lib/areaUnits";

export function AreaUnitSelector({ value, onChange, disabled }: { value: AreaUnit; onChange: (value: AreaUnit) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Area units</span>
      <Select value={value} onValueChange={(v) => onChange(v as AreaUnit)} disabled={disabled}>
        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="m2">m²</SelectItem>
          <SelectItem value="ft2">ft²</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
