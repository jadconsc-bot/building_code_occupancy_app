/**
 * LLM-judge accuracy evaluator for room detection results.
 *
 * After Claude Vision detects rooms, this passes the same image + the rooms
 * JSON to a second, cheaper model (Haiku) that scores each detection without
 * seeing the original prompt — pure blind review.  Results are logged and can
 * be stored for trend analysis / regression testing.
 *
 * Inspired by GStack's LLM-judge eval harness pattern.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ENV } from '../../_core/env';
import type { DetectedRoom } from './types';

// Use the fastest/cheapest vision model for judging — not generating.
const EVAL_MODEL = 'claude-haiku-4-5-20251001';

export interface RoomEvalScore {
  roomLabel: string;
  /** Does the label match text visible on the drawing? */
  labelAccuracy: 'correct' | 'plausible' | 'wrong';
  /** Does the bounding box roughly cover the right area? */
  boxPlausibility: 'good' | 'rough' | 'wrong';
  /** Is the NBC occupancy group classification appropriate? */
  occupancyCorrect: 'correct' | 'uncertain' | 'wrong';
  notes: string;
  /** Composite 0–1 score: correct+good=1.0, wrong+wrong=0.0 */
  score: number;
}

export interface DetectionEvalResult {
  pageId: number;
  roomScores: RoomEvalScore[];
  /** Rooms visible on the drawing but absent from the detected list */
  missedRooms: string[];
  /** Average composite score across all detected rooms */
  overallAccuracy: number;
  evaluatedAt: string;
  modelVersion: string;
}

const LABEL_WEIGHT = 0.5;
const BOX_WEIGHT = 0.3;
const OCCUPANCY_WEIGHT = 0.2;

function scoreRoom(r: RoomEvalScore): number {
  const labelScore = r.labelAccuracy === 'correct' ? 1.0
    : r.labelAccuracy === 'plausible' ? 0.5 : 0.0;
  const boxScore = r.boxPlausibility === 'good' ? 1.0
    : r.boxPlausibility === 'rough' ? 0.5 : 0.0;
  const occupancyScore = r.occupancyCorrect === 'correct' ? 1.0
    : r.occupancyCorrect === 'uncertain' ? 0.5 : 0.0;
  return (labelScore * LABEL_WEIGHT) + (boxScore * BOX_WEIGHT) + (occupancyScore * OCCUPANCY_WEIGHT);
}

export async function evaluateDetectionAccuracy(
  rooms: DetectedRoom[],
  pageId: number,
  pageBase64: string,
  imgW: number,
  imgH: number,
): Promise<DetectionEvalResult> {
  if (!ENV.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

  // Describe each detected room as a readable summary including position as
  // % of image so the judge can spatially verify without needing pixel math.
  const roomSummaries = rooms.map((r, i) => {
    const cx = Math.round(((r.boundingBox.x + r.boundingBox.width / 2) / imgW) * 100);
    const cy = Math.round(((r.boundingBox.y + r.boundingBox.height / 2) / imgH) * 100);
    const wPct = Math.round((r.boundingBox.width / imgW) * 100);
    const hPct = Math.round((r.boundingBox.height / imgH) * 100);
    return `${i + 1}. "${r.label}" — Group ${r.occupancyGroup}, ` +
      `centre ~(${cx}% from left, ${cy}% from top), ` +
      `size ~${wPct}% wide × ${hPct}% tall, ` +
      `confidence ${(r.confidence * 100).toFixed(0)}%`;
  }).join('\n');

  const userPrompt =
    `You are a QA evaluator checking AI-generated room detection results against the floor plan image.\n\n` +
    `DETECTED ROOMS (${rooms.length} total):\n${roomSummaries}\n\n` +
    `For each detected room, score:\n` +
    `- labelAccuracy: "correct" (label matches text on drawing exactly or nearly), ` +
    `"plausible" (reasonable interpretation), or "wrong" (label not present / misidentified)\n` +
    `- boxPlausibility: "good" (box covers the right room area), ` +
    `"rough" (approximately right but too large/small/offset), or "wrong" (wrong room entirely)\n` +
    `- occupancyCorrect: "correct" (NBC group appropriate), "uncertain" (ambiguous), or "wrong"\n` +
    `- notes: one short sentence explaining any issues\n\n` +
    `Also list any rooms clearly visible on the drawing that were NOT detected.\n\n` +
    `Return JSON exactly:\n` +
    `{"roomScores":[{"roomLabel":"","labelAccuracy":"correct|plausible|wrong",` +
    `"boxPlausibility":"good|rough|wrong","occupancyCorrect":"correct|uncertain|wrong",` +
    `"notes":""}],"missedRooms":["room name"],"overallAccuracy":0.0}`;

  const response = await client.messages.create({
    model: EVAL_MODEL,
    max_tokens: 4096,
    system:
      'You are a strict but fair QA evaluator for architectural AI systems. ' +
      'Assess only what is clearly visible. Return ONLY valid JSON, no markdown.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: pageBase64 },
        },
        { type: 'text', text: userPrompt },
      ],
    }],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Evaluator returned no text');

  const rawText = block.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(rawText) as {
    roomScores: Omit<RoomEvalScore, 'score'>[];
    missedRooms: string[];
    overallAccuracy: number;
  };

  const roomScores: RoomEvalScore[] = parsed.roomScores.map(r => ({
    ...r,
    score: scoreRoom(r as RoomEvalScore),
  }));

  const overallAccuracy = roomScores.length > 0
    ? roomScores.reduce((sum, r) => sum + r.score, 0) / roomScores.length
    : 0;

  const result: DetectionEvalResult = {
    pageId,
    roomScores,
    missedRooms: parsed.missedRooms ?? [],
    overallAccuracy: Math.round(overallAccuracy * 100) / 100,
    evaluatedAt: new Date().toISOString(),
    modelVersion: response.model,
  };

  // Log summary — store to DB once an eval_results table is added
  const passing = roomScores.filter(r => r.score >= 0.7).length;
  console.log(
    `[DetectionEval] page=${pageId} accuracy=${(overallAccuracy * 100).toFixed(1)}% ` +
    `(${passing}/${roomScores.length} rooms passing) ` +
    `missed=${result.missedRooms.length}`,
  );
  if (result.missedRooms.length > 0) {
    console.log(`[DetectionEval] Missed rooms: ${result.missedRooms.join(', ')}`);
  }
  const failing = roomScores.filter(r => r.score < 0.5);
  for (const f of failing) {
    console.warn(
      `[DetectionEval] Low score "${f.roomLabel}": ` +
      `label=${f.labelAccuracy} box=${f.boxPlausibility} occupancy=${f.occupancyCorrect} — ${f.notes}`,
    );
  }

  return result;
}
