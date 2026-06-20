/**
 * Smoke test: Detect, Count, and Visualize 2 workflow (codecomply/8).
 *
 * Runs the workflow against a known floor plan image and asserts that the
 * expected output keys are present, non-trivial, and geometrically sane
 * (room-shaped bboxes, not wall-line slivers from the old broken model).
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/smokeDetectCountVisualize.ts
 *
 * Optional:
 *   --url=https://...   Override the sample image URL
 *   --save              Write the annotated image to /tmp/dcv_annotated.jpg
 */

import 'dotenv/config';
import fs from 'fs';
import { runDetectCountVisualize } from '../services/detectCountVisualizeService';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);

// A real floor plan page from the production CDN (page 77, 78 detected rooms)
const SAMPLE_URL =
  args['url'] ??
  'https://d2xsxph8kpxj0f.cloudfront.net/118692545/9F4J2CDosTHNgtZbintBLn/drawing-analyses/1240/7ea4f431a12fa9564ae4d4ef8381fc7c50a207278f36d250cc09a4a01a1bfacc.png';

async function main() {
  console.log('\n=== Smoke Test: Detect, Count, and Visualize 2 (codecomply/8) ===');
  console.log('Image URL:', SAMPLE_URL.slice(0, 80) + '...');
  console.log('Running workflow...\n');

  const result = await runDetectCountVisualize({ type: 'url', value: SAMPLE_URL });

  // ── Assertions ─────────────────────────────────────────────────────────────
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string, detail = '') {
    if (condition) {
      console.log(`  ✓  ${label}${detail ? '  (' + detail + ')' : ''}`);
      passed++;
    } else {
      console.log(`  ✗  ${label}${detail ? '  (' + detail + ')' : ''}`);
      failed++;
    }
  }

  assert(result !== null, 'result is not null');

  if (result) {
    assert(typeof result.count === 'number', 'count_objects is a number', `value=${result.count}`);
    assert(result.count > 0, 'count_objects > 0', `detected ${result.count} rooms`);

    assert(Array.isArray(result.predictions), 'predictions is an array');
    assert(result.predictions.length > 0, 'predictions array is non-empty', `${result.predictions.length} items`);

    const first = result.predictions[0];
    assert(typeof first?.x === 'number', 'predictions[0].x is a number');
    assert(typeof first?.confidence === 'number', 'predictions[0].confidence is a number');
    assert(typeof first?.class === 'string', 'predictions[0].class is a string', `"${first?.class}"`);
    assert(!('points' in first), 'polygon points are stripped (INV-3)');

    assert(result.imageWidth > 0, 'imageWidth > 0', `${result.imageWidth}px`);
    assert(result.imageHeight > 0, 'imageHeight > 0', `${result.imageHeight}px`);

    assert(result.annotatedImageBuffer instanceof Buffer, 'annotatedImageBuffer is a Buffer');
    assert((result.annotatedImageBuffer?.length ?? 0) > 10_000, 'annotatedImageBuffer is non-trivial', `${Math.round((result.annotatedImageBuffer?.length ?? 0) / 1024)}KB`);

    // ── Geometry sanity: room-shaped bboxes, not wall-line slivers ────────────
    // Reference values from codecomply/8 live run on this same image:
    //   pred[0]: 241×174, pred[1]: 208×154, pred[2]: 337×444
    // Broken model (codecomply/4-7) produced slivers: 9×161, 11×758, 51×15
    const MIN_ROOM_DIM = 50;    // both sides must exceed this in pixels
    const MAX_ASPECT_RATIO = 8; // width/height or height/width must stay below this

    const roomShaped = result.predictions.filter(p => {
      const minDim = Math.min(p.width, p.height);
      const maxDim = Math.max(p.width, p.height);
      return minDim >= MIN_ROOM_DIM && maxDim / minDim <= MAX_ASPECT_RATIO;
    });

    const sliversDetected = result.predictions.filter(p => {
      const minDim = Math.min(p.width, p.height);
      const maxDim = Math.max(p.width, p.height);
      return minDim < MIN_ROOM_DIM || maxDim / minDim > MAX_ASPECT_RATIO;
    });

    assert(
      roomShaped.length > 0,
      'at least one room-shaped bbox (both dims ≥ 50px)',
      `${roomShaped.length}/${result.predictions.length} room-shaped`
    );
    assert(
      roomShaped.length >= result.predictions.length * 0.5,
      '≥50% of predictions are room-shaped (not wall slivers)',
      `${roomShaped.length}/${result.predictions.length} pass geometry check`
    );
    assert(
      sliversDetected.length === 0,
      'no wall-sliver detections (min dim < 50px or aspect ratio > 8)',
      sliversDetected.length === 0
        ? 'clean'
        : `${sliversDetected.length} slivers: ${sliversDetected.map(p => `${Math.round(p.width)}×${Math.round(p.height)}`).join(', ')}`
    );

    if (args['save'] && result.annotatedImageBuffer) {
      const outPath = '/tmp/dcv_annotated.jpg';
      fs.writeFileSync(outPath, result.annotatedImageBuffer);
      console.log(`\n  Annotated image saved to ${outPath}`);
    }

    console.log('\n  Top predictions:');
    result.predictions.slice(0, 3).forEach((p, i) => {
      const aspect = Math.max(p.width, p.height) / Math.min(p.width, p.height);
      console.log(`    [${i}] ${p.class}  conf=${p.confidence.toFixed(3)}  bbox=${Math.round(p.width)}×${Math.round(p.height)} @ (${Math.round(p.x)},${Math.round(p.y)})  aspect=${aspect.toFixed(1)}`);
    });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n─────────────────────────────────`);
  if (failed === 0) {
    console.log(`PASS  ${passed}/${passed + failed} assertions\n`);
    process.exit(0);
  } else {
    console.log(`FAIL  ${passed} passed, ${failed} failed\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});
