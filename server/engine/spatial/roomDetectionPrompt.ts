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
  labelContext: string = '',
  legendContext: string = '',
  templateContext: string = '',
): string {
  return `${legendContext}${templateContext}
Analyze this architectural floor plan drawing.
Detect ALL rooms, spaces, and architectural features visible in this floor plan.
Detection classes: ${ROOM_DETECTION_FEATURES.join(', ')}

Critical rules:
1. Use confidence < 0.7 for uncertain detections
2. Default to MORE RESTRICTIVE occupancy when ambiguous. EXCEPTIONS — classify as Group D (not Group F): mechanical rooms, boiler rooms, HVAC rooms, electrical rooms, janitor rooms, and utility/service rooms that support building operations in a residential or commercial building. Classify as Group C (not Group F): storage rooms (lockers, cold storage, bicycle rooms) that serve residential units. Group F applies ONLY to rooms with hazardous materials, industrial machinery, or manufacturing operations.
3. Include ALL visible rooms — do not skip small spaces
4. IMPORTANT: This image is exactly ${croppedW}×${croppedH} pixels. All boundingBox coordinates MUST be in this pixel space: x values 0–${croppedW}, y values 0–${croppedH}. Do NOT use a scaled-down coordinate system.
5. Area in square metres based on visible dimensions or scale bar
6. If the page has multiple floor plan drawings (e.g. Unit A and Unit B layouts), detect rooms in all of them
7. ADJACENT ROOMS share walls — draw each room's bounding box to its own interior wall face. Adjacent boxes must TOUCH but not overlap. If room A is to the left of room B, A's right edge must equal B's left edge. Never let two separate rooms have overlapping bounding boxes.
8. ALWAYS detect spaces even when unlabeled. For circulation: detect corridors (long narrow spaces connecting rooms), hallways, common areas between units, stairwells (typically shown with diagonal hatching lines or stair-tread symbols), landings, and lobbies — label as "Corridor", "Common Corridor", "Stairwell", "Stair Landing", or "Lobby". Classify corridors and common areas as Group C in residential buildings, Group D in office buildings. Classify stairwells as Group C or D matching the dominant building occupancy. For rooms: also detect any clearly enclosed space that appears to be a room even with no visible label — use best-estimate labels such as "Unlabeled Room", "Unlabeled Washroom", "Unlabeled Storage", or "Unlabeled Bedroom" based on visible fixtures (toilet = washroom, sink/counter = kitchen, bed outline = bedroom). Set confidence < 0.65 for all unlabeled detections.
9. DO NOT detect equipment labels, procurement symbols, or specification call-outs as rooms. These are graphical shapes that annotate equipment — not enclosed floor plan spaces. Ignore any shape whose text contains: "DESIGN-BUILDER", "CONTRACTOR", "PROVIDED & INSTALLED", "BY OWNER", "BY OTHERS", "N.I.C.", "NOT IN CONTRACT", "OWNER SUPPLIED", "LEGEND", "REVISION", "KEYNOTE", "PARTITION PLAN", "LOWER FLOOR", "FOUNDATION PLAN", "ROOF PLAN". Also ignore: revision clouds (irregular scalloped outlines used to mark drawing changes), north arrows, scale bars, drawing title bubbles, and legend key boxes. These shapes have NO bounding box in the rooms array.
10. DOOR WIDTH METADATA: For each feature of type "door" or "door_fire_rated", look for a dimension annotation immediately adjacent to the door symbol (e.g. "900", "2'-6\"", "36\"", "860mm", "0.9m", "2'-8\""). If a dimension annotation is clearly visible near the door, convert it to millimetres and record it as metadata: { "width": <number in mm> }. Imperial conversions: 2'-0"=610mm, 2'-6"=762mm, 2'-8"=813mm, 2'-10"=864mm, 3'-0"=914mm, 3'-6"=1067mm, 4'-0"=1219mm. If no dimension annotation is clearly visible adjacent to the door, omit metadata entirely — do not guess.
11. WASHROOMS AND BATHROOMS: Even when unlabeled, detect any space containing toilet, bathroom sink, or bathtub fixtures. These are almost always present between residential units and in mechanical cores. Label as "Washroom", "Bathroom", or "W/C" based on size and fixtures visible.
${labelContext}
Return JSON: {"rooms":[{"label":"string","boundingBox":{"x":0,"y":0,"width":0,"height":0},"areaSqm":0,"floorLevel":"string","occupancyGroup":"A|B|C|D|E|F","occupancyDivision":null,"confidence":0.0,"features":[{"type":"string","position":{"x":0,"y":0},"confidence":0.0,"metadata":{"width":900}}],"flags":[]}],"metadata":{"drawingType":"string","scale":"string","floorLevel":"string","totalDetectedArea":0,"northArrow":false,"dimensionsVisible":false,"language":"en","drawingQuality":"string"}}`;
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
