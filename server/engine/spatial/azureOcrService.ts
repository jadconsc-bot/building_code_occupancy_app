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
  const endpoint = ENV.azureDocIntelligenceEndpoint
    || process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT
    || '';
  const key = ENV.azureDocIntelligenceKey
    || process.env.AZURE_DOC_INTELLIGENCE_KEY
    || '';

  console.log(`[AzureOCR] Config check — endpoint: ${endpoint ? endpoint.substring(0, 40) + '...' : 'MISSING'}, key: ${key ? 'present' : 'MISSING'}`);

  if (!endpoint || !key) {
    console.warn('[AzureOCR] Not configured — skipping label extraction');
    return { labels: [], rawResponse: null };
  }

  const submitUrl =
    `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`;

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

export function filterRoomLabels(labels: OcrLabel[], imageHeight: number = 0): OcrLabel[] {
  // Exclude labels in the top 20% of the image — likely title block / schedule table
  const yMin = imageHeight > 0 ? imageHeight * 0.20 : 0;

  return labels.filter(label => {
    if (label.y < yMin) return false;

    const lower = label.text.toLowerCase();
    const text = label.text;

    if (ROOM_KEYWORDS.some(kw => lower.includes(kw))) return true;
    // Room codes with explicit prefix: AR-103, A-12, B.12 (prefix required to avoid matching bare numbers)
    if (/^[A-Z]{1,4}[-.]?\d+$/i.test(text)) return true;
    if (/^unit\s*\d+/i.test(text)) return true;

    return false;
  });
}
