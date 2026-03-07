import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCeilingHeightRequirements, type CeilingHeightRequirement } from "@/lib/ceilingHeightData";
import { Ruler, Info } from "lucide-react";

interface CeilingHeightTableProps {
  occupancy: string;
}

export function CeilingHeightTable({ occupancy }: CeilingHeightTableProps) {
  const requirements = getCeilingHeightRequirements(occupancy);

  if (!requirements) {
    return null;
  }

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" /> Minimum Ceiling Heights
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          NBC 2023 minimum ceiling height requirements for {requirements.occupancy}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Main Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-primary">
                  Space Type
                </th>
                <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-primary">
                  Metric
                </th>
                <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-primary">
                  Imperial
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="py-3 px-3 text-sm font-medium">Standard Spaces</td>
                <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                  {requirements.standardHeight}m
                </td>
                <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                  {requirements.standardHeightFeet}
                </td>
              </tr>
              
              {requirements.basementHeight && (
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 px-3 text-sm font-medium">Basements</td>
                  <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                    {requirements.basementHeight}m
                  </td>
                  <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                    {requirements.basementHeightFeet}
                  </td>
                </tr>
              )}
              
              {requirements.serviceRoomHeight && (
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 px-3 text-sm font-medium">Service Rooms</td>
                  <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                    {requirements.serviceRoomHeight}m
                  </td>
                  <td className="py-3 px-3 text-center text-lg font-bold text-primary">
                    {requirements.serviceRoomHeightFeet}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Important Notes */}
        {requirements.notes && requirements.notes.length > 0 && (
          <div className="mt-6 p-4 bg-primary/5 border-l-4 border-primary rounded-r-none">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                  Important Notes
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {requirements.notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Exceptions */}
        {requirements.exceptions && requirements.exceptions.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 border border-border rounded-none">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              Exceptions & Special Cases
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {requirements.exceptions.map((exception, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  <span>{exception}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reference */}
        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          <p>
            <strong>Reference:</strong> National Building Code of Canada 2023
            <br />
            Part 9 (Housing and Small Buildings) and Part 3 (Fire Protection, Occupant Safety and Accessibility)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
