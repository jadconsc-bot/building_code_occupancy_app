/**
 * Drawing Set Context Service
 *
 * Reads all pages of a drawing set in a single Claude call to extract
 * project metadata, building classification, abbreviations, floor hierarchy,
 * exit locations, and door/window schedules. This context is injected into
 * every subsequent room detection prompt so each page analysis is aware of
 * the full building.
 */

import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { getDb } from "../db";
import { drawingSetContexts } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";

const MAX_PAGES_FOR_CONTEXT = 20;
const THUMBNAIL_WIDTH = 400;

const CONTEXT_EXTRACTION_SYSTEM = `You are reading architectural drawing set pages to extract project metadata and building context. Respond ONLY with valid JSON — no markdown, no explanation.`;

function buildContextPrompt(pageCount: number): string {
  return `You are reading a complete architectural drawing set to extract project context. This context will be used to improve room detection accuracy on individual floor plan pages.

You are looking at ${pageCount} pages from a drawing set. Read ALL pages carefully before responding.

Extract the following:

PROJECT IDENTITY: project name and address (title block or cover sheet), architect/designer firm, client/developer name.

BUILDING CLASSIFICATION: primary occupancy type (residential_single_family, residential_multi_unit, commercial_office, commercial_retail, industrial, institutional, mixed_use), storeys above grade, basement present, construction type if stated (wood_frame, concrete_masonry, steel_frame, hybrid), sprinkler system (check mechanical notes or legends).

CODE AND JURISDICTION: applicable building code edition (ABC 2019, NBC 2020, BCBC 2024, OBC 2012), municipality/city, province.

DRAWING SET STRUCTURE: for each page — page number, sheet title, sheet type (floor_plan, section, elevation, detail, schedule, site, mechanical, electrical, structural, other).

FLOOR HIERARCHY (floor plans only): which page shows which floor (basement, main, upper, third, etc.).

SCALE: drawing scale (e.g. 1:50, 1:100). Note per-page differences.

ABBREVIATIONS AND LEGEND: list ALL abbreviations found in any legend box. Format: {"ABBREV": "Full Name"}. Common: MUD, PWDR, WIC, ENSUITE, MECH, ELEC, STOR, CORR, VEST, LDY, GAR, DEN, FAM, LIV, DIN, KIT.

SPATIAL CONTEXT: exit locations (which floor plan page, which side, what type), stair locations.

REVISION: current revision number/letter, most recent revision date (YYYY-MM-DD format).

DOOR AND WINDOW SCHEDULES:
Scan ALL pages carefully for schedule tables. These are typically found on dedicated schedule pages or in the lower portion of floor plan sheets. They appear as tables with columns for type ID, width, height, and other specifications.

DOOR SCHEDULE — look for a table titled "Door Schedule" or similar:
For each door type listed:
- typeId: the door tag ID (e.g. "D201", "D202", "101", "A")
- widthMm: door width converted to millimetres
  (if shown in feet/inches: 2'-0"=610mm, 2'-6"=762mm, 2'-8"=813mm, 2'-10"=864mm,
   3'-0"=914mm, 3'-6"=1067mm, 4'-0"=1219mm)
- heightMm: door height in millimetres (6'-8"=2032mm, 7'-0"=2134mm)
- doorType: door material/type if noted (e.g. "Solid Core", "Hollow Core", "Glass")
- fireRatingMin: fire rating in minutes if noted (20, 45, 60, 90), or null
- notes: any other relevant notes, or null

WINDOW SCHEDULE — look for a table titled "Window Schedule" or similar:
For each window type listed:
- typeId: the window tag ID (e.g. "211", "W1", "A")
- widthMm: window width in millimetres
- heightMm: window height in millimetres
- glazingType: glazing specification if noted (e.g. "Low-E", "Triple", "Double")
- operationType: window operation type if noted (e.g. "Casement", "Fixed", "Awning", "Slider")
- notes: any relevant notes, or null

Also note which pages contain schedule tables in schedulePageNumbers.
If no schedule is found, return empty arrays.

IMPORTANT: if information is not clearly visible, use null — never guess.

Respond ONLY with valid JSON:
{
  "projectName": null,
  "projectAddress": null,
  "architectFirm": null,
  "clientName": null,
  "buildingOccupancy": null,
  "numberOfStoreys": null,
  "basementPresent": null,
  "constructionType": null,
  "sprinklered": null,
  "codeEdition": null,
  "municipality": null,
  "province": null,
  "pageInventory": [{"pageNum": 0, "title": "", "type": ""}],
  "floorHierarchy": [{"floor": "", "pageNum": 0}],
  "confirmedScale": null,
  "typicalCeilingHeightM": null,
  "abbreviations": {},
  "exitLocations": [{"description": "", "pageNum": 0, "direction": ""}],
  "stairLocations": [{"pageNum": 0, "location": ""}],
  "currentRevision": null,
  "revisionDate": null,
  "doorSchedule": [{"typeId": "", "widthMm": null, "heightMm": null, "doorType": null, "fireRatingMin": null, "notes": null}],
  "windowSchedule": [{"typeId": "", "widthMm": null, "heightMm": null, "glazingType": null, "operationType": null, "notes": null}],
  "schedulePageNumbers": []
}`;
}

export interface DoorScheduleEntry {
  typeId: string;
  widthMm: number | null;
  heightMm: number | null;
  doorType: string | null;
  fireRatingMin: number | null;
  notes: string | null;
}

export interface WindowScheduleEntry {
  typeId: string;
  widthMm: number | null;
  heightMm: number | null;
  glazingType: string | null;
  operationType: string | null;
  notes: string | null;
}

export interface ExtractedSetContext {
  projectName: string | null;
  projectAddress: string | null;
  architectFirm: string | null;
  clientName: string | null;
  buildingOccupancy: string | null;
  numberOfStoreys: number | null;
  basementPresent: boolean | null;
  constructionType: string | null;
  sprinklered: boolean | null;
  codeEdition: string | null;
  municipality: string | null;
  province: string | null;
  pageInventory: Array<{ pageNum: number; title: string; type: string }>;
  floorHierarchy: Array<{ floor: string; pageNum: number }>;
  confirmedScale: string | null;
  typicalCeilingHeightM: number | null;
  abbreviations: Record<string, string>;
  exitLocations: Array<{ description: string; pageNum: number; direction: string }>;
  stairLocations: Array<{ pageNum: number; location: string }>;
  currentRevision: string | null;
  revisionDate: string | null;
  doorSchedule: DoorScheduleEntry[];
  windowSchedule: WindowScheduleEntry[];
  schedulePageNumbers: number[];
}

async function resizeToThumbnail(base64: string, targetWidth: number): Promise<string> {
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const resized = await sharp(buf)
    .resize(targetWidth, undefined, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return resized.toString('base64');
}

function safeParseContextJSON(raw: string): ExtractedSetContext {
  const stripped = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    const parsed = JSON.parse(stripped);
    return {
      projectName:            parsed.projectName ?? null,
      projectAddress:         parsed.projectAddress ?? null,
      architectFirm:          parsed.architectFirm ?? null,
      clientName:             parsed.clientName ?? null,
      buildingOccupancy:      parsed.buildingOccupancy ?? null,
      numberOfStoreys:        parsed.numberOfStoreys ?? null,
      basementPresent:        parsed.basementPresent ?? null,
      constructionType:       parsed.constructionType ?? null,
      sprinklered:            parsed.sprinklered ?? null,
      codeEdition:            parsed.codeEdition ?? null,
      municipality:           parsed.municipality ?? null,
      province:               parsed.province ?? null,
      pageInventory:          Array.isArray(parsed.pageInventory) ? parsed.pageInventory : [],
      floorHierarchy:         Array.isArray(parsed.floorHierarchy) ? parsed.floorHierarchy : [],
      confirmedScale:         parsed.confirmedScale ?? null,
      typicalCeilingHeightM:  parsed.typicalCeilingHeightM ?? null,
      abbreviations:          (parsed.abbreviations && typeof parsed.abbreviations === 'object') ? parsed.abbreviations : {},
      exitLocations:          Array.isArray(parsed.exitLocations) ? parsed.exitLocations : [],
      stairLocations:         Array.isArray(parsed.stairLocations) ? parsed.stairLocations : [],
      currentRevision:        parsed.currentRevision ?? null,
      revisionDate:           parsed.revisionDate ?? null,
      doorSchedule:           Array.isArray(parsed.doorSchedule) ? parsed.doorSchedule : [],
      windowSchedule:         Array.isArray(parsed.windowSchedule) ? parsed.windowSchedule : [],
      schedulePageNumbers:    Array.isArray(parsed.schedulePageNumbers) ? parsed.schedulePageNumbers : [],
    };
  } catch {
    return {
      projectName: null, projectAddress: null, architectFirm: null, clientName: null,
      buildingOccupancy: null, numberOfStoreys: null, basementPresent: null,
      constructionType: null, sprinklered: null, codeEdition: null,
      municipality: null, province: null, pageInventory: [], floorHierarchy: [],
      confirmedScale: null, typicalCeilingHeightM: null, abbreviations: {},
      exitLocations: [], stairLocations: [], currentRevision: null, revisionDate: null,
      doorSchedule: [], windowSchedule: [], schedulePageNumbers: [],
    };
  }
}

export async function extractDrawingSetContext(
  pages: { pageNum: number; base64: string }[],
  projectId: number,
  drawingAnalysisId: number,
  userId: number,
): Promise<ExtractedSetContext> {
  if (!ENV.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const capped = pages.slice(0, MAX_PAGES_FOR_CONTEXT);

  const thumbnails = await Promise.all(
    capped.map(async (p) => ({
      pageNum: p.pageNum,
      base64: await resizeToThumbnail(p.base64, THUMBNAIL_WIDTH),
    }))
  );

  const imageContent: Anthropic.MessageParam['content'] = thumbnails.flatMap(t => ([
    { type: 'text' as const, text: `--- Page ${t.pageNum} ---` },
    {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: t.base64,
      },
    },
  ]));

  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: CONTEXT_EXTRACTION_SYSTEM,
    messages: [{
      role: 'user',
      content: [
        ...imageContent,
        { type: 'text', text: buildContextPrompt(capped.length) },
      ],
    }],
  });

  const block = response.content[0];
  const raw = block?.type === 'text' ? block.text : '';
  const parsed = safeParseContextJSON(raw);

  const db = await getDb();
  if (db) {
    await db.insert(drawingSetContexts).values({
      projectId,
      drawingAnalysisId,
      projectName:           parsed.projectName,
      projectAddress:        parsed.projectAddress,
      architectFirm:         parsed.architectFirm,
      clientName:            parsed.clientName,
      buildingOccupancy:     parsed.buildingOccupancy,
      numberOfStoreys:       parsed.numberOfStoreys,
      constructionType:      parsed.constructionType,
      sprinklered:           parsed.sprinklered ? 1 : 0,
      basementPresent:       parsed.basementPresent ? 1 : 0,
      codeEdition:           parsed.codeEdition,
      municipality:          parsed.municipality,
      province:              parsed.province,
      totalPages:            pages.length,
      pageInventoryJson:     parsed.pageInventory,
      floorHierarchyJson:    parsed.floorHierarchy,
      confirmedScale:        parsed.confirmedScale,
      typicalCeilingHeightM: parsed.typicalCeilingHeightM != null ? String(parsed.typicalCeilingHeightM) as any : null,
      abbreviationsJson:     parsed.abbreviations,
      exitLocationsJson:     parsed.exitLocations,
      stairLocationsJson:    parsed.stairLocations,
      doorScheduleJson:      parsed.doorSchedule.length > 0 ? parsed.doorSchedule : null,
      windowScheduleJson:    parsed.windowSchedule.length > 0 ? parsed.windowSchedule : null,
      schedulePageNumbers:   parsed.schedulePageNumbers.length > 0 ? parsed.schedulePageNumbers : null,
      totalDoorTypes:        parsed.doorSchedule.length,
      totalWindowTypes:      parsed.windowSchedule.length,
      currentRevision:       parsed.currentRevision,
      revisionDate:          parsed.revisionDate ? new Date(parsed.revisionDate) : null,
      rawContextJson:        { raw, parsed },
      extractedBy:           userId,
    });
  }

  return parsed;
}

export function buildContextBlock(
  ctx: ExtractedSetContext,
  currentPageNum: number,
  totalPages?: number,
): string {
  const parts: string[] = ['=== PROJECT CONTEXT (from full drawing set read) ==='];

  if (ctx.projectName)    parts.push(`Project: ${ctx.projectName}`);
  if (ctx.projectAddress) parts.push(`Address: ${ctx.projectAddress}`);
  if (ctx.architectFirm)  parts.push(`Architect: ${ctx.architectFirm}`);

  if (ctx.buildingOccupancy) parts.push(`Building type: ${ctx.buildingOccupancy}`);
  if (ctx.numberOfStoreys) {
    parts.push(`Storeys: ${ctx.numberOfStoreys}${ctx.basementPresent ? ' + basement' : ''}`);
  }
  if (ctx.constructionType) parts.push(`Construction: ${ctx.constructionType}`);
  parts.push(`Sprinklered: ${ctx.sprinklered ? 'Yes' : 'No'}`);

  if (ctx.codeEdition)  parts.push(`Code: ${ctx.codeEdition}`);
  if (ctx.municipality) parts.push(`Municipality: ${ctx.municipality}`);

  if (ctx.confirmedScale) {
    parts.push(`Drawing scale: ${ctx.confirmedScale} (confirmed from title block)`);
  }

  const pageInfo = ctx.pageInventory?.find(p => p.pageNum === currentPageNum);
  if (pageInfo) {
    const total = totalPages ?? ctx.pageInventory?.length;
    parts.push(`Current page: ${pageInfo.title} (p.${currentPageNum}${total ? ` of ${total}` : ''})`);
    parts.push(`Page type: ${pageInfo.type}`);
  }

  const currentFloor = ctx.floorHierarchy?.find(f => f.pageNum === currentPageNum);
  if (currentFloor) parts.push(`Floor level: ${currentFloor.floor}`);
  const otherFloors = ctx.floorHierarchy?.filter(f => f.pageNum !== currentPageNum);
  if (otherFloors?.length) {
    parts.push(`Other floors: ${otherFloors.map(f => `${f.floor} (p.${f.pageNum})`).join(', ')}`);
  }

  if (ctx.abbreviations && Object.keys(ctx.abbreviations).length > 0) {
    parts.push('');
    parts.push('ABBREVIATIONS (use these exact full names for room labels):');
    for (const [abbrev, full] of Object.entries(ctx.abbreviations)) {
      parts.push(`  ${abbrev} = ${full}`);
    }
    parts.push('Do NOT invent room labels not in this list.');
  }

  if (ctx.exitLocations?.length) {
    parts.push('');
    parts.push('KNOWN EXIT LOCATIONS (for travel distance context):');
    for (const exit of ctx.exitLocations) {
      parts.push(`  - ${exit.description} (p.${exit.pageNum}, ${exit.direction})`);
    }
  }

  if (ctx.doorSchedule && ctx.doorSchedule.length > 0) {
    parts.push('');
    parts.push('DOOR SCHEDULE (from drawing set):');
    for (const d of ctx.doorSchedule.slice(0, 20)) {
      const dims = d.widthMm && d.heightMm ? `${d.widthMm}mm × ${d.heightMm}mm` : 'dimensions not found';
      const fr = d.fireRatingMin ? `, ${d.fireRatingMin}min FRR` : '';
      const dtype = d.doorType ? `, ${d.doorType}` : '';
      parts.push(`  ${d.typeId}: ${dims}${dtype}${fr}`);
    }
    parts.push('Use these exact dimensions when recording door features.');
  }

  if (ctx.windowSchedule && ctx.windowSchedule.length > 0) {
    parts.push('');
    parts.push('WINDOW SCHEDULE (from drawing set):');
    for (const w of ctx.windowSchedule.slice(0, 20)) {
      const dims = w.widthMm && w.heightMm ? `${w.widthMm}mm × ${w.heightMm}mm` : 'dimensions not found';
      const glaze = w.glazingType ? `, ${w.glazingType}` : '';
      const op = w.operationType ? ` ${w.operationType}` : '';
      parts.push(`  ${w.typeId}: ${dims}${glaze}${op}`);
    }
    parts.push('Use these exact dimensions when recording window features.');
  }

  parts.push('');
  parts.push('Use the above context when detecting rooms on this page.');
  parts.push('If a label appears to be an abbreviation, expand it using the abbreviations list above.');
  parts.push('=== END PROJECT CONTEXT ===');
  parts.push('');

  return parts.join('\n');
}
