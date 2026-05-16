import axios from 'axios';
import { ENV } from '../../_core/env';

export interface OcrLabel {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface OcrResult {
  labels: OcrLabel[];
  rawResponse: unknown;
}

export async function extractLabelsFromImage(
  imageBase64: string,
  imageWidth: number,
  imageHeight: number,
): Promise<OcrResult> {
  const endpoint = ENV.azureDocIntelligenceEndpoint;
  const key = ENV.azureDocIntelligenceKey;

  if (!endpoint || !key) {
    console.warn('[AzureOCR] Not configured — skipping label extraction');
    return { labels: [], rawResponse: null };
  }

  const submitUrl =
    `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview`;

  const submitResponse = await axios.post(
    submitUrl,
    { base64Source: imageBase64 },
    {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
    },
  );

  const operationUrl = submitResponse.headers['operation-location'];
  if (!operationUrl) throw new Error('Azure OCR: no operation-location header');

  let result: any = null;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await axios.get(operationUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': key },
    });
    if (poll.data.status === 'succeeded') { result = poll.data; break; }
    if (poll.data.status === 'failed') throw new Error('Azure OCR analysis failed');
  }

  if (!result) throw new Error('Azure OCR timed out');

  const labels: OcrLabel[] = [];
  const pages: any[] = result.analyzeResult?.pages ?? [];

  for (const page of pages) {
    const pageW: number = page.width ?? imageWidth;
    const pageH: number = page.height ?? imageHeight;
    const scaleX = imageWidth / pageW;
    const scaleY = imageHeight / pageH;

    for (const word of page.words ?? []) {
      const polygon: number[] = word.polygon ?? [];
      if (polygon.length < 8) continue;

      const xs = [polygon[0], polygon[2], polygon[4], polygon[6]];
      const ys = [polygon[1], polygon[3], polygon[5], polygon[7]];
      const minX = Math.min(...xs) * scaleX;
      const minY = Math.min(...ys) * scaleY;
      const maxX = Math.max(...xs) * scaleX;
      const maxY = Math.max(...ys) * scaleY;

      labels.push({
        text: word.content,
        x: Math.round((minX + maxX) / 2),
        y: Math.round((minY + maxY) / 2),
        width: Math.round(maxX - minX),
        height: Math.round(maxY - minY),
        confidence: word.confidence ?? 0.9,
      });
    }
  }

  console.log(`[AzureOCR] Extracted ${labels.length} text labels`);
  return { labels, rawResponse: result };
}

const ROOM_KEYWORDS = [
  'bedroom', 'bathroom', 'kitchen', 'living', 'dining',
  'corridor', 'hallway', 'vestibule', 'storage', 'closet',
  'laundry', 'utility', 'office', 'lobby', 'stair', 'elevator',
  'unit', 'suite', 'room', 'wc', 'ensuite', 'garage',
  'mechanical', 'electrical', 'janitor', 'lounge',
];

export function filterRoomLabels(labels: OcrLabel[]): OcrLabel[] {
  return labels.filter(label => {
    const lower = label.text.toLowerCase();
    return ROOM_KEYWORDS.some(kw => lower.includes(kw)) ||
      /^[A-Z]{1,4}-\d+$/.test(label.text) ||
      /^unit\s*\d+/i.test(label.text);
  });
}
