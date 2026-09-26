import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props { result: any; }
const scoreColor = (score: number): [number, number, number] => score >= 80 ? [22, 163, 74] : score >= 60 ? [202, 138, 4] : [220, 38, 38];
const rating = (score: number) => score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs Improvement" : "Poor";

export function SpaceAnalyzerPDFExport({ result }: Props) {
  const download = () => {
    const doc = new jsPDF(); const width = doc.internal.pageSize.getWidth(); const height = doc.internal.pageSize.getHeight(); const margin = 15; const content = width - margin * 2; let y = 38;
    const breakPage = (needed = 8) => { if (y + needed > height - 18) { doc.addPage(); y = 20; } };
    const line = (text: string, size = 9, color: [number, number, number] = [0,0,0], bold = false) => { const lines = doc.splitTextToSize(String(text), content); breakPage(lines.length * 4.5 + 2); doc.setFontSize(size); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color); doc.text(lines, margin, y); y += lines.length * 4.5 + 2; };
    const header = (title: string) => { breakPage(18); y += 3; doc.setFillColor(30,58,138); doc.rect(margin, y - 5, content, 10, "F"); doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255); doc.text(title.toUpperCase(), margin + 3, y + 2); doc.setTextColor(0,0,0); y += 10; };
    const key = (label: string, value: string) => { breakPage(8); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80); doc.text(`${label}:`, margin, y); doc.setFont("helvetica","normal"); doc.setTextColor(0,0,0); const lines = doc.splitTextToSize(value, content - 48); doc.text(lines, margin + 48, y); y += Math.max(6, lines.length * 4.5); };
    doc.setFillColor(30,58,138); doc.rect(0,0,width,30,"F"); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.text("ARCHITECTURAL SPACE ANALYSIS REPORT", width/2, 13, {align:"center"}); doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text("CodeComply — AI-Assisted Design Guidance", width/2, 22, {align:"center"}); doc.setTextColor(0,0,0);
    header("Executive Summary"); const overall = Number(result.overallScore) || 0; key("Drawing type", result.drawingType ?? "N/A"); key("Climate zone", result.climateZone ?? "N/A"); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.setTextColor(...scoreColor(overall)); doc.text(`${overall}/100 — ${rating(overall)}`, margin, y); y += 10; doc.setTextColor(0,0,0);
    const dimensions = [{key:"spaceDistribution",label:"Space Distribution"},{key:"naturalLight",label:"Natural Light"},{key:"roomLayout",label:"Room Layout"},{key:"ventilation",label:"Wind & Ventilation"},{key:"sustainableMaterials",label:"Sustainable Materials"}];
    header("Dimension Analysis"); dimensions.forEach(({key: k,label}) => { const section=result[k]; if(!section) return; header(label); const score=Number(section.score)||0; line(`Score: ${score}/100`, 11, scoreColor(score), true); (section.findings ?? []).forEach((item: string) => line(`• ${item}`)); if ((section.recommendations ?? []).length) { line("Recommendations",9,[30,58,138],true); section.recommendations.forEach((item: string) => line(`• ${item}`)); } });
    if (result.leedGapAnalysis) { header("LEED Gap Analysis"); key("Points identified", `${result.leedGapAnalysis.estimatedPoints ?? 0} / ${result.leedGapAnalysis.maxPossiblePoints ?? 0}`); (result.leedGapAnalysis.categories ?? []).forEach((cat:any) => { line(cat.category ?? "Category",9,[30,58,138],true); key("Status", String(cat.status ?? "N/A")); key("Gap", String(cat.gap ?? "N/A")); key("Action", String(cat.action ?? "N/A")); }); }
    if ((result.priorityActions ?? []).length) { header("Priority Actions"); result.priorityActions.forEach((item:string, i:number) => line(`${i+1}. ${item}`)); }
    header("Disclaimer"); line("This report is AI-generated design guidance for early planning purposes only. It is not a code compliance determination and does not replace review by a licensed design professional.",8,[80,80,80]);
    const pages = doc.getNumberOfPages(); for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160); doc.text(`CodeComply — Space Analysis — Page ${i} of ${pages}`, width/2, height-8, {align:"center"}); }
    const stamp = new Date().toISOString().replace(/[:.]/g,"-"); doc.save(`space-analysis-report-${stamp}.pdf`);
  };
  return <Button variant="outline" size="sm" onClick={download}><Download className="w-4 h-4 mr-2" /> Download PDF Report</Button>;
}
