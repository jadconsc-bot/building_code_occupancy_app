/**
 * Smoke test for the CodeComply Roboflow workflow.
 *
 * Runs the workflow against a representative floor plan image and verifies
 * that the returned payload has at least one populated output object. The
 * exact output keys are grounded from the live response at runtime rather than
 * hard-coded here.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/smokeCodeComplyWorkflow.ts
 *
 * Optional:
 *   --url=https://...   Override the sample image URL
 *   --save              Write any annotated base64 output to /tmp/codecomply_workflow_annotated.jpg
 */

import 'dotenv/config';
import fs from 'node:fs';
import { runCodeComplyWorkflow } from '../services/codeComplyWorkflowService';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(arg => arg.startsWith('--'))
    .map(arg => {
      const [key, value] = arg.slice(2).split('=');
      return [key, value ?? 'true'];
    }),
);

const SAMPLE_URL =
  args.url ??
  'https://d2xsxph8kpxj0f.cloudfront.net/118692545/9F4J2CDosTHNgtZbintBLn/drawing-analyses/1240/7ea4f431a12fa9564ae4d4ef8381fc7c50a207278f36d250cc09a4a01a1bfacc.png';

async function main(): Promise<void> {
  console.log('\n=== Smoke Test: CodeComply Roboflow Workflow ===');
  console.log('Image URL:', SAMPLE_URL.slice(0, 80) + '...');
  console.log('Running workflow...\n');

  const result = await runCodeComplyWorkflow({ type: 'url', value: SAMPLE_URL });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string, detail = ''): void {
    if (condition) {
      console.log(`  ✓  ${label}${detail ? `  (${detail})` : ''}`);
      passed++;
    } else {
      console.log(`  ✗  ${label}${detail ? `  (${detail})` : ''}`);
      failed++;
    }
  }

  assert(result.outputs.length > 0, 'outputs array is non-empty', `${result.outputs.length} item(s)`);
  assert(Object.keys(result.firstOutput ?? {}).length > 0, 'first output has keys', result.outputKeys.join(', '));

  if (result.annotatedImageBuffer) {
    assert(result.annotatedImageBuffer.length > 10_000, 'annotated image buffer is non-trivial', `${Math.round(result.annotatedImageBuffer.length / 1024)}KB`);
    if (args.save) {
      const outPath = '/tmp/codecomply_workflow_annotated.jpg';
      fs.writeFileSync(outPath, result.annotatedImageBuffer);
      console.log(`\n  Annotated image saved to ${outPath}`);
    }
  } else {
    console.log('  (No annotated image buffer returned)');
  }

  console.log('\n  Top-level output keys:');
  console.log(`    ${result.outputKeys.join(', ') || '(none)'}`);

  console.log('\n─────────────────────────────────');
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
