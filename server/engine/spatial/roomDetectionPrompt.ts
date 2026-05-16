export const ROOM_DETECTION_SYSTEM_PROMPT = `You are an expert architectural drawing analyst specializing in Canadian building code compliance. Your role is to extract structured spatial data from floor plan drawings.

EXTRACT ONLY what is clearly visible. Do not infer or assume.
If uncertain, use lower confidence scores (below 0.7).

For each room/space detected, classify occupancy using NBC 2020:
- A: Assembly (theatres, schools, arenas, churches)
- B: Institutional (hospitals, detention, care facilities)
- C: Residential (apartments, hotels, dormitories)
- D: Business & Personal Services (offices, clinics)
- E: Mercantile (retail stores, supermarkets)
- F: Industrial (warehouses, labs, manufacturing)

Default to more restrictive classification when ambiguous.
Flag rooms with confidence below 0.7 for human review.`;

export const ROOM_DETECTION_FEATURES = [
  'door', 'door_fire_rated', 'window', 'stair', 'elevator',
  'exit_sign', 'fire_extinguisher', 'sprinkler_head',
  'kitchen_sink', 'stove', 'toilet', 'bathroom_sink',
  'lab_bench', 'fume_hood', 'nursing_station',
  'retail_counter', 'reception_desk', 'fixed_seating',
  'loading_dock', 'emergency_lighting',
] as const;

export function buildRoomDetectionPrompt(
  croppedW: number,
  croppedH: number,
  contextStr: string = '',
  labelContext: string = '',
): string {
  return `Analyze this architectural floor plan drawing.
${contextStr}

Detect ALL rooms, spaces, and architectural features visible in this floor plan.
Detection classes: ${ROOM_DETECTION_FEATURES.join(', ')}

Critical rules:
1. Use confidence < 0.7 for uncertain detections
2. Default to MORE RESTRICTIVE occupancy when ambiguous
3. Include ALL visible rooms — do not skip small spaces
4. IMPORTANT: This image is exactly ${croppedW}×${croppedH} pixels. All boundingBox coordinates MUST be in this pixel space: x values 0–${croppedW}, y values 0–${croppedH}. Do NOT use a scaled-down coordinate system.
5. Area in square metres based on visible dimensions or scale bar
6. If the page has multiple floor plan drawings (e.g. Unit A and Unit B layouts), detect rooms in all of them
${labelContext}
Return JSON: {"rooms":[{"label":"string","boundingBox":{"x":0,"y":0,"width":0,"height":0},"areaSqm":0,"floorLevel":"string","occupancyGroup":"A|B|C|D|E|F","occupancyDivision":null,"confidence":0.0,"features":[{"type":"string","position":{"x":0,"y":0},"confidence":0.0}],"flags":[]}],"metadata":{"drawingType":"string","scale":"string","floorLevel":"string","totalDetectedArea":0,"northArrow":false,"dimensionsVisible":false,"language":"en","drawingQuality":"string"}}`;
}

export const ROOM_DETECTION_JSON_SCHEMA = {
  rooms: [{
    label: 'string — room name/number as shown',
    boundingBox: { x: 'number', y: 'number', width: 'number', height: 'number' },
    areaSqm: 'number',
    floorLevel: 'string',
    occupancyGroup: 'A|B|C|D|E|F',
    occupancyDivision: 'number|null',
    confidence: 'number 0.0-1.0',
    features: [{
      type: 'one of the detection classes',
      position: { x: 'number', y: 'number' },
      confidence: 'number 0.0-1.0',
      count: 'number optional',
      metadata: 'object optional',
    }],
    flags: ['string array'],
  }],
  metadata: {
    drawingType: 'floor_plan|site_plan|elevation|section|unknown',
    scale: 'string e.g. 1:100',
    floorLevel: 'string',
    totalDetectedArea: 'number',
    northArrow: 'boolean',
    dimensionsVisible: 'boolean',
    language: 'en|fr|mixed',
    drawingQuality: 'cad|hand_drawn|scanned|unknown',
  },
};
