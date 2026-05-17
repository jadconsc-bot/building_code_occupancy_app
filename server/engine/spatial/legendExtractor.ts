import type { OcrLabel } from './azureOcrService';

export interface DrawingLegend {
  rawText: string;
  abbreviations: Record<string, string>;
  wallTypes: string[];
  roomCodePattern: string;
  generalNotes: string[];
  hasLegend: boolean;
}

const LEGEND_TRIGGERS = [
  'general notes', 'drawing notes', 'legend', 'symbols',
  'abbreviations', 'conventions', 'keynotes', 'notes:',
  'general:', 'refer to', 'all dimensions', 'nts',
  'not to scale', 'unless noted', 'drawing convention',
];

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  'W/R': 'Washroom',
  'WR': 'Washroom',
  'WC': 'Water Closet',
  'BF': 'Barrier Free',
  'MEC': 'Mechanical',
  'MECH': 'Mechanical',
  'ELEC': 'Electrical',
  'NTS': 'Not to Scale',
  'TYP': 'Typical',
  'SIM': 'Similar',
  'EQ': 'Equal',
  'CLG': 'Ceiling',
  'FFL': 'Finished Floor Level',
  'GWB': 'Gypsum Wallboard',
  'MTL': 'Metal',
  'STL': 'Steel',
  'CONC': 'Concrete',
  'WIC': 'Walk-in Closet',
  'ENS': 'Ensuite',
  'DEN': 'Den',
  'FAM': 'Family Room',
  'REC': 'Recreation Room',
};

export function extractLegend(
  labels: OcrLabel[],
  imgW: number,
  imgH: number,
): DrawingLegend {
  // Find anchor label (e.g. "GENERAL NOTES" or "LEGEND")
  let legendCenterX = -1;
  let legendCenterY = -1;

  for (const label of labels) {
    const lower = label.text.toLowerCase();
    if (LEGEND_TRIGGERS.some(t => lower.includes(t))) {
      legendCenterX = label.x;
      legendCenterY = label.y;
      break;
    }
  }

  if (legendCenterX === -1) {
    return {
      rawText: '',
      abbreviations: KNOWN_ABBREVIATIONS,
      wallTypes: [],
      roomCodePattern: '',
      generalNotes: [],
      hasLegend: false,
    };
  }

  // Collect all labels within 400px of the legend anchor
  const LEGEND_RADIUS = 400;
  const legendLabels: OcrLabel[] = labels.filter(label => {
    const dist = Math.sqrt(
      Math.pow(label.x - legendCenterX, 2) +
      Math.pow(label.y - legendCenterY, 2),
    );
    return dist < LEGEND_RADIUS;
  });

  // Reading order: top-to-bottom, left-to-right
  legendLabels.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  const rawText = legendLabels.map(l => l.text).join(' ');

  // Start from known abbreviations and add anything parsed from legend text
  const abbreviations = { ...KNOWN_ABBREVIATIONS };
  const abbrevPattern = /([A-Z][A-Z/.]{0,6})\s*[=\-:]\s*([A-Za-z][A-Za-z\s]{2,30})/g;
  let match;
  while ((match = abbrevPattern.exec(rawText)) !== null) {
    const code = match[1].trim();
    const meaning = match[2].trim();
    if (code.length <= 8 && meaning.length <= 40) {
      abbreviations[code] = meaning;
    }
  }

  // Wall type lines
  const wallKeywords = ['hatch', 'wall', 'separation', 'frr', 'fire', 'rated', 'assembly'];
  const wallTypes = legendLabels
    .filter(l => wallKeywords.some(k => l.text.toLowerCase().includes(k)))
    .map(l => l.text);

  // Room code pattern
  let roomCodePattern = '';
  const codePatternMatch = rawText.match(/AR[-.]?\d+|[A-Z]{2,3}[-.]?\d+/);
  if (codePatternMatch) {
    roomCodePattern = `Room codes follow pattern: ${codePatternMatch[0].replace(/\d+/, '##')} (e.g. ${codePatternMatch[0]})`;
  }

  // General notes: anything not a trigger keyword, 4–200 chars
  const generalNotes = legendLabels
    .filter(l => !LEGEND_TRIGGERS.some(t => l.text.toLowerCase().includes(t)))
    .map(l => l.text)
    .filter(t => t.length > 3 && t.length < 200)
    .slice(0, 20);

  console.log(
    `[LegendExtractor] Found legend at (${legendCenterX},${legendCenterY}),` +
    ` extracted ${Object.keys(abbreviations).length} abbreviations`,
  );

  return {
    rawText,
    abbreviations,
    wallTypes,
    roomCodePattern,
    generalNotes,
    hasLegend: true,
  };
}

export function formatLegendForPrompt(legend: DrawingLegend): string {
  if (!legend.hasLegend && Object.keys(legend.abbreviations).length === 0) {
    return '';
  }

  const lines: string[] = [
    'DRAWING LEGEND AND CONVENTIONS (extracted from this drawing):',
    'IMPORTANT: This section contains drawing metadata and instructions.',
    'Do NOT detect rooms from this information — use it to INTERPRET labels.',
    '',
  ];

  const abbrevEntries = Object.entries(legend.abbreviations).slice(0, 20);
  if (abbrevEntries.length > 0) {
    lines.push('ABBREVIATIONS:');
    for (const [code, meaning] of abbrevEntries) {
      lines.push(`  ${code} = ${meaning}`);
    }
    lines.push('');
  }

  if (legend.roomCodePattern) {
    lines.push(`ROOM CODES: ${legend.roomCodePattern}`);
    lines.push('');
  }

  if (legend.wallTypes.length > 0) {
    lines.push('WALL TYPES:');
    legend.wallTypes.forEach(w => lines.push(`  ${w}`));
    lines.push('');
  }

  if (legend.generalNotes.length > 0) {
    lines.push('GENERAL NOTES (first 5):');
    legend.generalNotes.slice(0, 5).forEach(n => lines.push(`  ${n}`));
    lines.push('');
  }

  lines.push('END OF DRAWING LEGEND — Now detect rooms from the floor plan geometry below.');
  lines.push('');

  return lines.join('\n');
}
