import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Calculator, Info, BookOpen, Building2 } from "lucide-react";

import { occupantLoadFactors, getLoadFactorsForOccupancy, calculateOccupantLoad } from "@shared/occupantLoadFactors";
import type { OccupantLoadFactor } from "@shared/occupantLoadFactors";

interface OccupantLoadSectionProps {
  occupancyCode: string;
}

export function OccupantLoadSection({ occupancyCode }: OccupantLoadSectionProps) {
  const [floorArea, setFloorArea] = useState<string>("");
  const [selectedFactorId, setSelectedFactorId] = useState<string>("");

  const relevantFactors = useMemo(() => {
    return getLoadFactorsForOccupancy(occupancyCode);
  }, [occupancyCode]);

  const selectedFactor = useMemo(() => {
    return occupantLoadFactors.find(f => f.id === selectedFactorId);
  }, [selectedFactorId]);

  const calculatedLoad = useMemo(() => {
    const area = parseFloat(floorArea);
    if (isNaN(area) || area <= 0 || !selectedFactor?.areaPerPerson) return null;
    return calculateOccupantLoad(area, selectedFactor.areaPerPerson);
  }, [floorArea, selectedFactor]);

  // Group factors by category
  const factorsByCategory = useMemo(() => {
    const grouped: Record<string, OccupantLoadFactor[]> = {};
    relevantFactors.forEach(factor => {
      if (!grouped[factor.category]) {
        grouped[factor.category] = [];
      }
      grouped[factor.category].push(factor);
    });
    return grouped;
  }, [relevantFactors]);

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
      <CardHeader className="pb-4 border-b border-indigo-100">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900">
          <Users className="h-5 w-5 text-indigo-600" />
          Occupant Load Factors
          <Badge variant="outline" className="ml-2 text-xs border-indigo-300 text-indigo-700">
            NBC Table 3.1.17.1
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Calculate maximum occupant load based on floor area and use type per National Building Code requirements.
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Calculator Section */}
        <div className="bg-white rounded-lg border border-indigo-100 p-4">
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-indigo-600" />
            Occupant Load Calculator
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor-area" className="text-sm font-medium">
                Floor Area (m²)
              </Label>
              <Input
                id="floor-area"
                type="number"
                placeholder="Enter floor area"
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                className="border-indigo-200 focus:border-indigo-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="use-type" className="text-sm font-medium">
                Use Type
              </Label>
              <select
                id="use-type"
                value={selectedFactorId}
                onChange={(e) => setSelectedFactorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select use type...</option>
                {Object.entries(factorsByCategory).map(([category, factors]) => (
                  <optgroup key={category} label={category}>
                    {factors.map(factor => (
                      <option key={factor.id} value={factor.id}>
                        {factor.useType} {factor.areaPerPerson ? `(${factor.areaPerPerson} m²/person)` : `(${factor.clause})`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Result */}
          {calculatedLoad !== null && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-700 font-medium">Calculated Occupant Load</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {floorArea} m² ÷ {selectedFactor?.areaPerPerson} m²/person
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-900">{calculatedLoad}</p>
                  <p className="text-xs text-indigo-600">persons</p>
                </div>
              </div>
            </div>
          )}

          {selectedFactor && !selectedFactor.areaPerPerson && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Special Calculation Required</p>
                  <p className="text-xs text-amber-700 mt-1">
                    For {selectedFactor.useType}, the occupant load is determined by: <strong>{selectedFactor.clause}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reference Table */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="reference-table" className="border border-indigo-100 rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-indigo-50/50">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                NBC Table 3.1.17.1 Reference - Applicable Load Factors
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50/50">
                      <TableHead className="font-semibold text-indigo-900">Use Type</TableHead>
                      <TableHead className="font-semibold text-indigo-900 text-center">Area/Person (m²)</TableHead>
                      <TableHead className="font-semibold text-indigo-900">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(factorsByCategory).map(([category, factors]) => (
                      <>
                        <TableRow key={category} className="bg-indigo-100/30">
                          <TableCell colSpan={3} className="font-semibold text-indigo-800 py-2">
                            <Building2 className="h-3 w-3 inline mr-2" />
                            {category}
                          </TableCell>
                        </TableRow>
                        {factors.map(factor => (
                          <TableRow 
                            key={factor.id} 
                            className={`hover:bg-indigo-50/50 cursor-pointer ${selectedFactorId === factor.id ? 'bg-indigo-100' : ''}`}
                            onClick={() => setSelectedFactorId(factor.id)}
                          >
                            <TableCell className="text-sm">{factor.useType}</TableCell>
                            <TableCell className="text-center">
                              {factor.areaPerPerson !== null ? (
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                                  {factor.areaPerPerson.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">{factor.clause}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{factor.notes}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Full NBC Table Reference */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="full-table" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-gray-600" />
                Complete NBC Table 3.1.17.1 - All Occupancy Types
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Use Type</TableHead>
                      <TableHead className="font-semibold text-center">Area/Person (m²)</TableHead>
                      <TableHead className="font-semibold">Applicable Groups</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupantLoadFactors.map(factor => (
                      <TableRow key={factor.id} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm">{factor.useType}</TableCell>
                        <TableCell className="text-center">
                          {factor.areaPerPerson !== null ? (
                            <Badge variant="outline">{factor.areaPerPerson.toFixed(2)}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">{factor.clause}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {factor.occupancyGroups.map(group => (
                              <Badge key={group} variant="secondary" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">NBC Reference:</p>
                <p>Table 3.1.17.1 - Occupant Load, forming part of Sentence 3.1.17.1.(1)</p>
                <p className="mt-2">The occupant load of a floor area or part of a floor area shall be based on:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>The number of persons for which the area is designed, or</li>
                  <li>The number determined from Table 3.1.17.1, whichever is greater</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
