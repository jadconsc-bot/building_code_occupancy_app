import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  MapPin, 
  Building2, 
  Ruler, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  ExternalLink,
  ArrowLeftRight,
  Calculator,
  Layers,
  Download
} from 'lucide-react';
import { exportMunicipalBylawsToExcel } from '@/lib/excelExport';
import { toast } from 'sonner';
import {
  municipalities,
  getMunicipalityById,
  getZoneByCode,
  getAllZonesForMunicipality,
  calculateSetbackCompliance,
  checkCoverageCompliance,
  checkHeightCompliance,
  checkLotCompliance,
  compareZonesAcrossMunicipalities,
  Municipality,
  ZoneRegulation,
} from '@/lib/municipalBylawsData';

export function MunicipalBylawsCalculator() {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('edmonton');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [activeCalculator, setActiveCalculator] = useState<'setback' | 'coverage' | 'height' | 'lot'>('setback');
  
  // Setback inputs
  const [frontSetback, setFrontSetback] = useState<string>('');
  const [rearSetback, setRearSetback] = useState<string>('');
  const [sideInteriorSetback, setSideInteriorSetback] = useState<string>('');
  const [sideCornerSetback, setSideCornerSetback] = useState<string>('');
  
  // Coverage inputs
  const [buildingFootprint, setBuildingFootprint] = useState<string>('');
  const [lotArea, setLotArea] = useState<string>('');
  
  // Height inputs
  const [proposedHeight, setProposedHeight] = useState<string>('');
  const [proposedStoreys, setProposedStoreys] = useState<string>('');
  
  // Lot inputs
  const [lotWidth, setLotWidth] = useState<string>('');

  // Comparison state
  const [comparisonType, setComparisonType] = useState<'single-detached' | 'duplex' | 'multi-family'>('single-detached');

  const municipality = useMemo(() => getMunicipalityById(selectedMunicipality), [selectedMunicipality]);
  const zones = useMemo(() => getAllZonesForMunicipality(selectedMunicipality), [selectedMunicipality]);
  const zone = useMemo(() => getZoneByCode(selectedMunicipality, selectedZone), [selectedMunicipality, selectedZone]);

  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipality(value);
    setSelectedZone('');
  };

  const checkSetbackCompliance = () => {
    if (!selectedZone) {
      toast.error('Please select a zone first');
      return null;
    }
    
    const result = calculateSetbackCompliance(selectedMunicipality, selectedZone, {
      front: parseFloat(frontSetback) || 0,
      rear: parseFloat(rearSetback) || 0,
      sideInterior: parseFloat(sideInteriorSetback) || 0,
      sideCorner: sideCornerSetback ? parseFloat(sideCornerSetback) : undefined,
    });
    
    return result;
  };

  const checkCoverage = () => {
    if (!selectedZone) {
      toast.error('Please select a zone first');
      return null;
    }
    
    const result = checkCoverageCompliance(
      selectedMunicipality,
      selectedZone,
      parseFloat(buildingFootprint) || 0,
      parseFloat(lotArea) || 0
    );
    
    return result;
  };

  const checkHeight = () => {
    if (!selectedZone) {
      toast.error('Please select a zone first');
      return null;
    }
    
    const result = checkHeightCompliance(
      selectedMunicipality,
      selectedZone,
      parseFloat(proposedHeight) || 0,
      proposedStoreys ? parseInt(proposedStoreys) : undefined
    );
    
    return result;
  };

  const checkLot = () => {
    if (!selectedZone) {
      toast.error('Please select a zone first');
      return null;
    }
    
    const result = checkLotCompliance(
      selectedMunicipality,
      selectedZone,
      parseFloat(lotArea) || 0,
      parseFloat(lotWidth) || 0
    );
    
    return result;
  };

  const comparisonData = useMemo(() => {
    return compareZonesAcrossMunicipalities(comparisonType);
  }, [comparisonType]);

  return (
    <div className="space-y-6">
      {/* Municipality and Zone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Municipal Land Use Bylaws
          </CardTitle>
          <CardDescription>
            Select a municipality and zone to view regulations and use calculators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Municipality</Label>
              <Select value={selectedMunicipality} onValueChange={handleMunicipalityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}, {m.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.zoneCode} value={z.zoneCode}>
                      {z.zoneCode} - {z.zoneName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {municipality && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Bylaw: {municipality.bylawName} #{municipality.bylawNumber}</span>
              <a 
                href={municipality.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                View Full Bylaw <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Details */}
      {zone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {zone.zoneCode} - {zone.zoneName}
            </CardTitle>
            <CardDescription>{zone.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Setbacks Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Setbacks
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Front:</span>
                    <span className="font-medium">{zone.setbacks.front}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rear:</span>
                    <span className="font-medium">{zone.setbacks.rear}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Side (Interior):</span>
                    <span className="font-medium">{zone.setbacks.sideInterior}m</span>
                  </div>
                  {zone.setbacks.sideCorner && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Side (Corner):</span>
                      <span className="font-medium">{zone.setbacks.sideCorner}m</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Height Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Height
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Height:</span>
                    <span className="font-medium">{zone.height.maxHeight}m</span>
                  </div>
                  {zone.height.maxStoreys && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Storeys:</span>
                      <span className="font-medium">{zone.height.maxStoreys}</span>
                    </div>
                  )}
                </div>
                {zone.height.notes && (
                  <p className="text-xs text-muted-foreground mt-2">{zone.height.notes}</p>
                )}
              </div>

              {/* Coverage Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Coverage
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Site:</span>
                    <span className="font-medium">{zone.coverage.maxSiteCoverage}%</span>
                  </div>
                  {zone.coverage.maxHardSurface && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Hard Surface:</span>
                      <span className="font-medium">{zone.coverage.maxHardSurface}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lot Requirements Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Lot Requirements
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Area:</span>
                    <span className="font-medium">{zone.lotRequirements.minArea} {zone.lotRequirements.areaUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Width:</span>
                    <span className="font-medium">{zone.lotRequirements.minWidth}m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {zone.specialNotes && zone.specialNotes.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4" /> Special Notes
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  {zone.specialNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projections */}
            {zone.projections && zone.projections.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Allowed Projections into Setbacks</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Max Projection</TableHead>
                      <TableHead>Max Length</TableHead>
                      <TableHead>Conditions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.projections.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.type}</TableCell>
                        <TableCell>{p.maxProjection}m</TableCell>
                        <TableCell>{p.maxLength ? `${p.maxLength}m` : '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{p.conditions || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calculators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Compliance Calculators
              </CardTitle>
              <CardDescription>
                Check if your proposed development meets the zoning requirements
              </CardDescription>
            </div>
            {zone && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const setbackResult = checkSetbackCompliance();
                  const coverageResult = checkCoverage();
                  const heightResult = checkHeight();
                  const lotResult = checkLot();
                  
                  const frontProposed = parseFloat(frontSetback) || 0;
                  const rearProposed = parseFloat(rearSetback) || 0;
                  const sideInteriorProposed = parseFloat(sideInteriorSetback) || 0;
                  const sideCornerProposed = parseFloat(sideCornerSetback) || 0;
                  
                  exportMunicipalBylawsToExcel({
                    municipality: municipality?.name || '',
                    zone: zone.zoneCode,
                    zoneName: zone.zoneName,
                    setbacks: {
                      front: { required: zone.setbacks.front, proposed: frontProposed, compliant: frontProposed >= zone.setbacks.front },
                      rear: { required: zone.setbacks.rear, proposed: rearProposed, compliant: rearProposed >= zone.setbacks.rear },
                      sideInterior: { required: zone.setbacks.sideInterior, proposed: sideInteriorProposed, compliant: sideInteriorProposed >= zone.setbacks.sideInterior },
                      sideCorner: zone.setbacks.sideCorner ? { required: zone.setbacks.sideCorner, proposed: sideCornerProposed, compliant: sideCornerProposed >= zone.setbacks.sideCorner } : undefined
                    },
                    coverage: coverageResult ? { maxAllowed: zone.coverage.maxSiteCoverage, proposed: coverageResult.actualCoverage, compliant: coverageResult.compliant } : undefined,
                    height: heightResult ? { maxHeight: zone.height.maxHeight, proposedHeight: parseFloat(proposedHeight) || 0, maxStoreys: zone.height.maxStoreys, proposedStoreys: proposedStoreys ? parseInt(proposedStoreys) : undefined, compliant: heightResult.compliant } : undefined,
                    lot: lotResult ? { minArea: zone.lotRequirements.minArea, proposedArea: parseFloat(lotArea) || 0, minWidth: zone.lotRequirements.minWidth, proposedWidth: parseFloat(lotWidth) || 0, compliant: lotResult.compliant } : undefined,
                    overallCompliant: (setbackResult?.compliant ?? true) && (coverageResult?.compliant ?? true) && (heightResult?.compliant ?? true) && (lotResult?.compliant ?? true)
                  });
                  toast.success('Exported to Excel successfully!');
                }}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCalculator} onValueChange={(v) => setActiveCalculator(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setback">Setbacks</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="height">Height</TabsTrigger>
              <TabsTrigger value="lot">Lot Size</TabsTrigger>
            </TabsList>

            <TabsContent value="setback" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frontSetback">Front Setback (m)</Label>
                  <Input
                    id="frontSetback"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Min: ${zone.setbacks.front}m` : 'Select zone'}
                    value={frontSetback}
                    onChange={(e) => setFrontSetback(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rearSetback">Rear Setback (m)</Label>
                  <Input
                    id="rearSetback"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Min: ${zone.setbacks.rear}m` : 'Select zone'}
                    value={rearSetback}
                    onChange={(e) => setRearSetback(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sideInteriorSetback">Side Interior (m)</Label>
                  <Input
                    id="sideInteriorSetback"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Min: ${zone.setbacks.sideInterior}m` : 'Select zone'}
                    value={sideInteriorSetback}
                    onChange={(e) => setSideInteriorSetback(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sideCornerSetback">Side Corner (m)</Label>
                  <Input
                    id="sideCornerSetback"
                    type="number"
                    step="0.1"
                    placeholder={zone?.setbacks.sideCorner ? `Min: ${zone.setbacks.sideCorner}m` : 'N/A'}
                    value={sideCornerSetback}
                    onChange={(e) => setSideCornerSetback(e.target.value)}
                  />
                </div>
              </div>
              
              <SetbackComplianceResult result={checkSetbackCompliance()} zone={zone} />
            </TabsContent>

            <TabsContent value="coverage" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingFootprint">Building Footprint (m²)</Label>
                  <Input
                    id="buildingFootprint"
                    type="number"
                    step="0.1"
                    placeholder="Enter building footprint"
                    value={buildingFootprint}
                    onChange={(e) => setBuildingFootprint(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotAreaCoverage">Lot Area (m²)</Label>
                  <Input
                    id="lotAreaCoverage"
                    type="number"
                    step="0.1"
                    placeholder="Enter lot area"
                    value={lotArea}
                    onChange={(e) => setLotArea(e.target.value)}
                  />
                </div>
              </div>
              
              <CoverageComplianceResult result={checkCoverage()} zone={zone} />
            </TabsContent>

            <TabsContent value="height" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposedHeight">Proposed Height (m)</Label>
                  <Input
                    id="proposedHeight"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Max: ${zone.height.maxHeight}m` : 'Select zone'}
                    value={proposedHeight}
                    onChange={(e) => setProposedHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedStoreys">Proposed Storeys</Label>
                  <Input
                    id="proposedStoreys"
                    type="number"
                    step="1"
                    placeholder={zone?.height.maxStoreys ? `Max: ${zone.height.maxStoreys}` : 'N/A'}
                    value={proposedStoreys}
                    onChange={(e) => setProposedStoreys(e.target.value)}
                  />
                </div>
              </div>
              
              <HeightComplianceResult result={checkHeight()} zone={zone} />
            </TabsContent>

            <TabsContent value="lot" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lotAreaLot">Lot Area (m²)</Label>
                  <Input
                    id="lotAreaLot"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Min: ${zone.lotRequirements.minArea} ${zone.lotRequirements.areaUnit}` : 'Select zone'}
                    value={lotArea}
                    onChange={(e) => setLotArea(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotWidth">Lot Width (m)</Label>
                  <Input
                    id="lotWidth"
                    type="number"
                    step="0.1"
                    placeholder={zone ? `Min: ${zone.lotRequirements.minWidth}m` : 'Select zone'}
                    value={lotWidth}
                    onChange={(e) => setLotWidth(e.target.value)}
                  />
                </div>
              </div>
              
              <LotComplianceResult result={checkLot()} zone={zone} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Zone Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Compare Zones Across Municipalities
          </CardTitle>
          <CardDescription>
            Compare similar zone types across Edmonton, Calgary, Airdrie, Lethbridge, and Vancouver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Zone Type</Label>
            <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as any)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-detached">Single Detached Residential</SelectItem>
                <SelectItem value="duplex">Duplex / Semi-Detached</SelectItem>
                <SelectItem value="multi-family">Multi-Family Residential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Municipality</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Front</TableHead>
                  <TableHead>Rear</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Max Height</TableHead>
                  <TableHead>Max Coverage</TableHead>
                  <TableHead>Min Lot Area</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map(({ municipality, zone }) => (
                  <TableRow key={`${municipality}-${zone.zoneCode}`}>
                    <TableCell className="font-medium">{municipality}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{zone.zoneCode}</Badge>
                    </TableCell>
                    <TableCell>{zone.setbacks.front}m</TableCell>
                    <TableCell>{zone.setbacks.rear}m</TableCell>
                    <TableCell>{zone.setbacks.sideInterior}m</TableCell>
                    <TableCell>{zone.height.maxHeight}m</TableCell>
                    <TableCell>{zone.coverage.maxSiteCoverage}%</TableCell>
                    <TableCell>{zone.lotRequirements.minArea} {zone.lotRequirements.areaUnit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* General Regulations */}
      {municipality?.generalRegulations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              General Regulations - {municipality.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {municipality.generalRegulations.deckMaxHeight && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Deck Height</p>
                  <p className="font-semibold">{municipality.generalRegulations.deckMaxHeight}m</p>
                </div>
              )}
              {municipality.generalRegulations.fenceMaxHeight && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Fence Height</p>
                  <p className="font-semibold">{municipality.generalRegulations.fenceMaxHeight}m</p>
                </div>
              )}
              {municipality.generalRegulations.accessoryBuildingMaxArea && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Accessory Building Area</p>
                  <p className="font-semibold">{municipality.generalRegulations.accessoryBuildingMaxArea}m²</p>
                </div>
              )}
              {municipality.generalRegulations.accessoryBuildingMaxHeight && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Accessory Building Height</p>
                  <p className="font-semibold">{municipality.generalRegulations.accessoryBuildingMaxHeight}m</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compliance Result Components
function SetbackComplianceResult({ result, zone }: { result: ReturnType<typeof calculateSetbackCompliance> | null; zone: ZoneRegulation | undefined }) {
  if (!zone) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Select a Zone</AlertTitle>
        <AlertDescription>Please select a municipality and zone to check setback compliance.</AlertDescription>
      </Alert>
    );
  }

  if (!result) return null;

  return (
    <Alert variant={result.compliant ? 'default' : 'destructive'}>
      {result.compliant ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>{result.compliant ? 'Compliant' : 'Non-Compliant'}</AlertTitle>
      <AlertDescription>
        {result.compliant ? (
          'All proposed setbacks meet or exceed the minimum requirements.'
        ) : (
          <ul className="list-disc list-inside mt-2">
            {result.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

function CoverageComplianceResult({ result, zone }: { result: ReturnType<typeof checkCoverageCompliance> | null; zone: ZoneRegulation | undefined }) {
  if (!zone) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Select a Zone</AlertTitle>
        <AlertDescription>Please select a municipality and zone to check coverage compliance.</AlertDescription>
      </Alert>
    );
  }

  if (!result) return null;

  return (
    <Alert variant={result.compliant ? 'default' : 'destructive'}>
      {result.compliant ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {result.compliant ? 'Compliant' : 'Non-Compliant'} - {result.actualCoverage.toFixed(1)}% Coverage
      </AlertTitle>
      <AlertDescription>{result.message}</AlertDescription>
    </Alert>
  );
}

function HeightComplianceResult({ result, zone }: { result: ReturnType<typeof checkHeightCompliance> | null; zone: ZoneRegulation | undefined }) {
  if (!zone) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Select a Zone</AlertTitle>
        <AlertDescription>Please select a municipality and zone to check height compliance.</AlertDescription>
      </Alert>
    );
  }

  if (!result) return null;

  return (
    <Alert variant={result.compliant ? 'default' : 'destructive'}>
      {result.compliant ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>{result.compliant ? 'Compliant' : 'Non-Compliant'}</AlertTitle>
      <AlertDescription>
        {result.compliant ? (
          'Proposed height and storeys meet the zone requirements.'
        ) : (
          <ul className="list-disc list-inside mt-2">
            {result.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

function LotComplianceResult({ result, zone }: { result: ReturnType<typeof checkLotCompliance> | null; zone: ZoneRegulation | undefined }) {
  if (!zone) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Select a Zone</AlertTitle>
        <AlertDescription>Please select a municipality and zone to check lot compliance.</AlertDescription>
      </Alert>
    );
  }

  if (!result) return null;

  return (
    <Alert variant={result.compliant ? 'default' : 'destructive'}>
      {result.compliant ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>{result.compliant ? 'Compliant' : 'Non-Compliant'}</AlertTitle>
      <AlertDescription>
        {result.compliant ? (
          'Lot dimensions meet the minimum requirements for this zone.'
        ) : (
          <ul className="list-disc list-inside mt-2">
            {result.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
