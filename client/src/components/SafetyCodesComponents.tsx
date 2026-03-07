import { useState } from "react";
import { 
  Building2, 
  Zap, 
  Droplets, 
  Flame, 
  FileCheck, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  Award,
  ClipboardCheck,
  Shield,
  Users,
  Gavel,
  Info,
  ExternalLink,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  PermitRequirement, 
  CertificateRequirement,
  InspectorPower,
  OwnerResponsibility,
  AppealsInfo,
  getPermitsForOccupancy,
  getPermitTypeColor,
  getPermitTypeBgColor,
  certificateRequirements,
  varianceInfo,
  inspectorPowers,
  ownerResponsibilities,
  appealsInfo
} from "@/lib/safetyCodesData";

// Icon mapping for permit types
const permitTypeIcons: Record<string, React.ReactNode> = {
  building: <Building2 className="w-5 h-5" />,
  electrical: <Zap className="w-5 h-5" />,
  plumbing: <Droplets className="w-5 h-5" />,
  gas: <Flame className="w-5 h-5" />,
  fire: <Flame className="w-5 h-5" />,
  elevating: <Building2 className="w-5 h-5" />
};

interface PermitRequirementsProps {
  occupancyCode: string;
  occupancyName: string;
}

export function PermitRequirements({ occupancyCode, occupancyName }: PermitRequirementsProps) {
  const permits = getPermitsForOccupancy(occupancyCode);
  const [expandedPermit, setExpandedPermit] = useState<string | null>(null);

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Permit Requirements</CardTitle>
        </div>
        <CardDescription>
          Required permits for {occupancyName} occupancies under the Alberta Safety Codes Act
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {permits.map((permit, index) => (
            <div 
              key={`${permit.type}-${index}`}
              className={`border rounded-lg p-4 ${getPermitTypeBgColor(permit.type)} transition-all`}
            >
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedPermit(expandedPermit === `${permit.type}-${index}` ? null : `${permit.type}-${index}`)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getPermitTypeColor(permit.type)}`}>
                    {permitTypeIcons[permit.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{permit.name}</h4>
                      {permit.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{permit.description}</p>
                    {permit.conditions && (
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {permit.conditions}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-gray-400">
                  {expandedPermit === `${permit.type}-${index}` ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              {expandedPermit === `${permit.type}-${index}` && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Inspection Stages</h5>
                      <div className="flex flex-wrap gap-1">
                        {permit.inspectionStages?.map((stage, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-white">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Code Reference</h5>
                      <p className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                        {permit.codeReference}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> Permits must be obtained before commencing work. 
              Working without required permits is an offence under the Safety Codes Act (Section 67) 
              and may result in administrative penalties.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateRequirementsSection() {
  return (
    <Card className="border-2 border-green-200 bg-green-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-green-600" />
          <CardTitle className="text-lg">Certificate Requirements</CardTitle>
        </div>
        <CardDescription>
          Trade certifications required under the Safety Codes Act (Section 41)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificateRequirements.map((cert, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">{cert.trade}</h4>
                  <p className="text-sm text-green-700 font-medium">{cert.certificateType}</p>
                  <p className="text-xs text-gray-600 mt-1">{cert.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">Required for:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {cert.requiredFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">
              No person shall employ or authorize a person who does not hold a certificate of competency 
              to control or operate any thing or undertake any process or activity if this Act requires 
              that person hold a certificate of competency.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VarianceInformationSection() {
  return (
    <Card className="border-2 border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg">{varianceInfo.title}</CardTitle>
        </div>
        <CardDescription>
          {varianceInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              Application Process
            </h4>
            <ol className="space-y-2">
              {varianceInfo.process.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Requirements
            </h4>
            <ul className="space-y-2">
              {varianceInfo.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            <strong>Reference:</strong> {varianceInfo.codeReference}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function InspectorPowersSection() {
  return (
    <Card className="border-2 border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg">Safety Codes Officer Powers</CardTitle>
        </div>
        <CardDescription>
          Powers and duties during inspections under the Safety Codes Act (Sections 31-34)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="powers">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                Officer Powers During Inspection
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {inspectorPowers.map((power, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900 text-sm">{power.power}</h5>
                        <p className="text-xs text-gray-600 mt-1">{power.description}</p>
                        <p className="text-xs text-orange-700 mt-1">Ref: {power.codeReference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="responsibilities">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Owner/Occupier Responsibilities
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {ownerResponsibilities.map((resp, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900 text-sm">{resp.responsibility}</h5>
                        <p className="text-xs text-gray-600 mt-1">{resp.description}</p>
                        <p className="text-xs text-orange-700 mt-1">Ref: {resp.codeReference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800">
              <strong>Warning:</strong> If a person refuses to allow a safety codes officer to exercise 
              their powers or interferes with an officer, the Administrator, municipality, or Council 
              may apply to the Court of King's Bench for an order restraining that person (Section 37).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppealsProcessSection() {
  return (
    <Card className="border-2 border-slate-200 bg-slate-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-slate-600" />
          <CardTitle className="text-lg">Appeals Process</CardTitle>
        </div>
        <CardDescription>
          How to appeal orders, permit refusals, and administrative penalties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {appealsInfo.map((appeal, index) => (
            <AccordionItem key={index} value={`appeal-${index}`}>
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-slate-600" />
                  {appeal.type}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 space-y-4">
                  <p className="text-sm text-gray-700">{appeal.description}</p>
                  
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      <strong>Timeline:</strong> {appeal.timeline}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm mb-2">Process:</h5>
                    <ol className="space-y-1">
                      {appeal.process.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <p className="text-xs text-slate-600">
                    <strong>Reference:</strong> {appeal.codeReference}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              For more information on the appeals process, contact the 
              <strong> Alberta Safety Codes Council</strong> or visit their website.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Combined Safety Codes Section for the Building Code tab
interface SafetyCodesSectionProps {
  occupancyCode: string;
  occupancyName: string;
}

export function SafetyCodesSection({ occupancyCode, occupancyName }: SafetyCodesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b-2 border-primary pb-2 mb-6">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Alberta Safety Codes Act Requirements
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Based on RSA 2000, Chapter S-1 (Current as of December 1, 2025)
        </p>
      </div>
      
      <PermitRequirements occupancyCode={occupancyCode} occupancyName={occupancyName} />
      <CertificateRequirementsSection />
      <VarianceInformationSection />
      <InspectorPowersSection />
      <AppealsProcessSection />
    </div>
  );
}
