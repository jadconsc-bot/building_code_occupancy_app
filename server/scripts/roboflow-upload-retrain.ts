/**
 * Upload the cleaned CodeComply COCO room dataset to Roboflow.
 * Optional flags can generate a version and queue training after upload.
 *
 * Always run the non-mutating preview first:
 *   npx ts-node server/scripts/roboflow-upload-retrain.ts --dry-run
 *
 * A live run mutates the configured Roboflow project and writes only its
 * local report into the selected dataset root.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const SPLITS = ['train', 'valid', 'test'] as const;
const API_ROOT = 'https://api.roboflow.com';
const REQUEST_INTERVAL_MS = 100;
const VERSION_POLL_INTERVAL_MS = 5_000;
const VERSION_TIMEOUT_MS = 10 * 60_000;

type Split = (typeof SPLITS)[number];

interface CocoImage {
  id: number;
  file_name: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

interface CocoAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  [key: string]: unknown;
}

interface CocoCategory {
  id: number;
  name: string;
  supercategory?: string;
}

interface CocoManifest {
  images: CocoImage[];
  annotations: CocoAnnotation[];
  categories: CocoCategory[];
  info?: unknown;
  licenses?: unknown;
}

interface UploadError {
  split: Split;
  filename: string;
  stage: 'image' | 'annotation';
  message: string;
}

interface UploadCounts {
  uploaded: number;
  skippedExisting: number;
  failed: number;
}

interface ExistingImage {
  id?: string;
  name?: string;
  annotations?: { count?: number };
}

interface CliOptions {
  dryRun: boolean;
  inputRoot: string;
  forceSplit: Split | null;
  generateVersion: boolean;
  train: boolean;
}

function loadLocalEnv(): void {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const datasetArg = args.find(a => a.startsWith('--dataset='));
  const splitArg = args.find(a => a.startsWith('--split='));

  const inputRoot = datasetArg
    ? datasetArg.split('=').slice(1).join('=')
    : path.join(process.env.HOME || '', 'Downloads', 'codecomply-training-clean');

  const rawSplit = splitArg ? splitArg.split('=').slice(1).join('=') : '';
  const forceSplit = (SPLITS as readonly string[]).includes(rawSplit)
    ? rawSplit as Split
    : null;

  return {
    dryRun: args.includes('--dry-run'),
    inputRoot,
    forceSplit,
    generateVersion: args.includes('--generate-version'),
    train: args.includes('--train'),
  };
}

function manifestForSplitRoot(inputRoot: string): CocoManifest {
  const manifestPath = path.join(inputRoot, '_annotations.coco.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing COCO manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CocoManifest;
  if (!Array.isArray(manifest.images) || !Array.isArray(manifest.annotations)) {
    throw new Error(`Invalid COCO manifest: ${manifestPath}`);
  }
  return manifest;
}

function manifestForSplitDir(inputRoot: string, split: Split): CocoManifest {
  const manifestPath = path.join(inputRoot, split, '_annotations.coco.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing cleaned manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CocoManifest;
  if (!Array.isArray(manifest.images) || !Array.isArray(manifest.annotations)) {
    throw new Error(`Invalid COCO manifest: ${manifestPath}`);
  }
  return manifest;
}

function apiUrl(route: string, apiKey: string, params: Record<string, string> = {}): string {
  const url = new URL(route, API_ROOT);
  url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
  }
  return payload;
}

async function verifyProject(apiKey: string, workspace: string, project: string): Promise<any> {
  const response = await fetch(apiUrl(`/${workspace}/${project}`, apiKey));
  const payload = await parseResponse(response);
  const projectType = payload?.project?.type;
  if (projectType && projectType !== 'instance-segmentation') {
    throw new Error(
      `Project ${workspace}/${project} has type ${projectType}; expected instance-segmentation`,
    );
  }
  return payload;
}

async function listExistingImages(
  apiKey: string,
  workspace: string,
  project: string,
): Promise<Map<string, ExistingImage>> {
  const existing = new Map<string, ExistingImage>();
  let offset = 0;
  const limit = 250;

  while (true) {
    const response = await fetch(apiUrl(`/${workspace}/${project}/search`, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset,
        limit,
        in_dataset: true,
        fields: ['id', 'name', 'annotations', 'split'],
      }),
    });
    const payload = await parseResponse(response);
    const results = (payload?.results ?? []) as ExistingImage[];
    for (const result of results) {
      if (result.name) existing.set(result.name, result);
    }
    offset += results.length;
    if (results.length === 0 || offset >= Number(payload?.total ?? 0)) break;
    await sleep(REQUEST_INTERVAL_MS);
  }
  return existing;
}

function annotationsByImage(manifest: CocoManifest): Map<number, CocoAnnotation[]> {
  const grouped = new Map<number, CocoAnnotation[]>();
  for (const annotation of manifest.annotations) {
    const list = grouped.get(annotation.image_id) ?? [];
    list.push(annotation);
    grouped.set(annotation.image_id, list);
  }
  return grouped;
}

function imageIdFromUpload(payload: any): string | null {
  const candidates = [
    payload?.id,
    payload?.image?.id,
    payload?.success?.id,
    payload?.success?.image?.id,
  ];
  const found = candidates.find(value => typeof value === 'string' && value.length > 0);
  return found ?? null;
}

async function uploadImage(
  apiKey: string,
  project: string,
  split: Split,
  imagePath: string,
  filename: string,
): Promise<string> {
  const form = new FormData();
  const bytes = fs.readFileSync(imagePath);
  form.append('name', filename);
  form.append('split', split);
  form.append('file', new Blob([new Uint8Array(bytes)]), filename);

  const response = await fetch(apiUrl(`/dataset/${project}/upload`, apiKey), {
    method: 'POST',
    body: form,
  });
  const payload = await parseResponse(response);
  const imageId = imageIdFromUpload(payload);
  if (!imageId) {
    throw new Error(`Upload succeeded but returned no image ID: ${JSON.stringify(payload)}`);
  }
  return imageId;
}

async function uploadAnnotation(
  apiKey: string,
  project: string,
  imageId: string,
  image: CocoImage,
  annotations: CocoAnnotation[],
  categories: CocoCategory[],
): Promise<void> {
  // Roboflow's documented annotation endpoint requires the uploaded image ID.
  // A one-image COCO manifest preserves polygon segmentation and category data.
  const annotationName = `${path.parse(image.file_name).name}.coco.json`;
  const miniManifest = {
    images: [image],
    annotations,
    categories,
  };
  const response = await fetch(
    apiUrl(`/dataset/${project}/annotate/${encodeURIComponent(imageId)}`, apiKey, {
      name: annotationName,
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(miniManifest),
    },
  );
  await parseResponse(response);
}

function versionNumberFrom(payload: any): number | null {
  const candidates = [payload?.version, payload?.version?.version, payload?.version?.id, payload?.id];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isInteger(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const lastPart = candidate.split('/').at(-1);
      if (lastPart && /^\d+$/.test(lastPart)) return Number(lastPart);
    }
  }
  return null;
}

async function generateVersion(apiKey: string, workspace: string, project: string): Promise<number> {
  const response = await fetch(apiUrl(`/${workspace}/${project}/generate`, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      split: { train: 89, valid: 7, test: 4 },
      preprocessing: {
        'auto-orient': true,
        resize: { enabled: true, width: 640, height: 640, format: 'Stretch to' },
      },
      augmentation: {},
    }),
  });
  const payload = await parseResponse(response);
  const versionNumber = versionNumberFrom(payload);
  if (versionNumber === null) {
    throw new Error(`Version generation returned no version number: ${JSON.stringify(payload)}`);
  }
  return versionNumber;
}

async function waitForVersion(
  apiKey: string,
  workspace: string,
  project: string,
  versionNumber: number,
): Promise<void> {
  const deadline = Date.now() + VERSION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const response = await fetch(apiUrl(`/${workspace}/${project}/${versionNumber}`, apiKey));
    if (response.ok) {
      const payload = await parseResponse(response);
      const status = String(payload?.version?.status ?? payload?.status ?? '').toLowerCase();
      if (['failed', 'error'].includes(status)) {
        throw new Error(`Version ${versionNumber} generation failed with status ${status}`);
      }
      if (!status || ['ready', 'complete', 'completed', 'generated', 'finished'].includes(status)) {
        return;
      }
      console.log(`[Roboflow] Version ${versionNumber} status: ${status}`);
    } else if (response.status !== 404) {
      await parseResponse(response);
    }
    await sleep(VERSION_POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for version ${versionNumber} after 10 minutes`);
}

async function triggerTraining(
  apiKey: string,
  workspace: string,
  project: string,
  versionNumber: number,
): Promise<string> {
  const response = await fetch(apiUrl(`/${workspace}/${project}/${versionNumber}/train`, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelType: 'yolov8n-seg',
      checkpoint: 'coco',
    }),
  });
  const payload = await parseResponse(response);
  const jobId = payload?.trainingId ?? payload?.jobId ?? payload?.id;
  if (typeof jobId !== 'string' && typeof jobId !== 'number') {
    throw new Error(`Training request returned no job ID: ${JSON.stringify(payload)}`);
  }
  return String(jobId);
}

function writeUploadReport(
  reportPath: string,
  workspace: string,
  project: string,
  counts: Record<Split, UploadCounts>,
  errors: UploadError[],
  versionNumber: number | null,
  trainingJobId: string | null,
): void {
  const lines = [
    '# Roboflow Upload and Retraining Report',
    '',
    `- Timestamp: ${new Date().toISOString()}`,
    `- Workspace/project: \`${workspace}/${project}\``,
    `- Dataset version: ${versionNumber ?? 'not generated'}`,
    `- Training job ID: ${trainingJobId ?? 'not queued'}`,
    '',
    '## Upload Summary',
    '',
    '| Split | Uploaded | Existing skipped | Failed |',
    '|---|---:|---:|---:|',
    ...SPLITS.map(split => {
      const item = counts[split];
      return `| ${split} | ${item.uploaded} | ${item.skippedExisting} | ${item.failed} |`;
    }),
    '',
    '## Upload Errors',
    '',
    ...(errors.length > 0
      ? errors.map(error => `- ${error.split}/${error.filename} (${error.stage}): ${error.message}`)
      : ['- None']),
    '',
    `Check training progress at https://app.roboflow.com/${workspace}/${project}`,
    '',
    'Once training completes, update ROBOFLOW_WORKFLOW_URL in ' +
      'server/services/roboflowSegmentationService.ts to point to the new version.',
    '',
  ];
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
}

async function dryRun(
  inputRoot: string,
  manifests: Record<Split, CocoManifest>,
  workspace: string,
  project: string,
): Promise<void> {
  console.log('[Roboflow] DRY RUN — no API calls or remote changes will be made.');
  console.log(`[Roboflow] Target: ${workspace}/${project}`);
  console.log(`[Roboflow] Input: ${inputRoot}`);
  let total = 0;
  for (const split of SPLITS) {
    const manifest = manifests[split];
    total += manifest.images.length;
    console.log(
      `[Roboflow] ${split}: would upload ${manifest.images.length} images and ` +
      `${manifest.annotations.length} polygon annotations`,
    );
    for (const image of manifest.images.slice(0, 3)) {
      console.log(`  preview: ${split}/${image.file_name}`);
    }
  }
  console.log(`[Roboflow] Total images planned: ${total}`);
  console.log('[Roboflow] Existing filenames would be searched and skipped before upload.');
  console.log('[Roboflow] Request pacing: at least 100ms between API requests.');
  console.log('[Roboflow] Version generation and training are opt-in via flags.');
}

async function main(): Promise<void> {
  loadLocalEnv();
  const {
    dryRun: dryRunEnabled,
    inputRoot,
    forceSplit,
    generateVersion: generateVersionEnabled,
    train: trainEnabled,
  } = parseCliOptions();
  const apiKey = process.env.ROBOFLOW_API_KEY ?? '';
  const workspace = process.env.ROBOFLOW_WORKSPACE || 'jose-acevedo';
  const project = process.env.ROBOFLOW_PROJECT || 'codecomply';
  const reportPath = path.join(inputRoot, 'UPLOAD_REPORT.md');

  if (!fs.existsSync(inputRoot)) {
    throw new Error(`Dataset does not exist: ${inputRoot}`);
  }
  const usingSingleSplitDataset = forceSplit !== null;
  const manifests = usingSingleSplitDataset
    ? Object.fromEntries(
        SPLITS.map(split => [
          split,
          { images: [], annotations: [], categories: [], info: undefined, licenses: undefined },
        ]),
      ) as unknown as Record<Split, CocoManifest>
    : Object.fromEntries(
        SPLITS.map(split => [split, manifestForSplitDir(inputRoot, split)]),
      ) as Record<Split, CocoManifest>;

  if (usingSingleSplitDataset) {
    const manifest = manifestForSplitRoot(inputRoot);
    manifests[forceSplit!] = manifest;
  }

  const effectiveInputLabel = usingSingleSplitDataset
    ? `${inputRoot} (forced split: ${forceSplit})`
    : inputRoot;

  if (dryRunEnabled) {
    console.log(`[Roboflow] API key present: ${apiKey ? 'yes' : 'no'}`);
    console.log(`[Roboflow] Dataset: ${effectiveInputLabel}`);
    await dryRun(inputRoot, manifests, workspace, project);
    return;
  }
  if (!apiKey) {
    throw new Error('ROBOFLOW_API_KEY is missing from the environment or .env.local');
  }
  if (trainEnabled && !generateVersionEnabled) {
    throw new Error('--train requires --generate-version');
  }

  console.log(`[Roboflow] Verifying project ${workspace}/${project}...`);
  await verifyProject(apiKey, workspace, project);
  console.log('[Roboflow] Project authentication and type verified.');

  console.log('[Roboflow] Loading existing filenames for idempotent upload...');
  const existingImages = await listExistingImages(apiKey, workspace, project);
  console.log(`[Roboflow] Found ${existingImages.size} existing filenames.`);

  const counts = Object.fromEntries(
    SPLITS.map(split => [split, { uploaded: 0, skippedExisting: 0, failed: 0 }]),
  ) as Record<Split, UploadCounts>;
  const errors: UploadError[] = [];
  const uploadSplits: Split[] = usingSingleSplitDataset ? [forceSplit!] : [...SPLITS];
  const total = uploadSplits.reduce((sum, split) => sum + manifests[split].images.length, 0);
  let current = 0;

  for (const split of uploadSplits) {
    const manifest = manifests[split];
    const groupedAnnotations = annotationsByImage(manifest);
    for (const image of manifest.images) {
      current += 1;
      console.log(`Uploading ${current}/${total}: ${image.file_name}`);
      if (existingImages.has(image.file_name)) {
        counts[split].skippedExisting += 1;
        console.log('  skipped: filename already exists in project');
        continue;
      }

      const imagePath = usingSingleSplitDataset
        ? path.join(inputRoot, 'images', image.file_name)
        : path.join(inputRoot, split, image.file_name);
      if (!fs.existsSync(imagePath)) {
        counts[split].failed += 1;
        errors.push({ split, filename: image.file_name, stage: 'image', message: 'local file missing' });
        continue;
      }

      let uploadedImageId: string;
      try {
        uploadedImageId = await uploadImage(apiKey, project, split, imagePath, image.file_name);
      } catch (error) {
        counts[split].failed += 1;
        errors.push({
          split,
          filename: image.file_name,
          stage: 'image',
          message: error instanceof Error ? error.message : String(error),
        });
        await sleep(REQUEST_INTERVAL_MS);
        continue;
      }

      await sleep(REQUEST_INTERVAL_MS);
      try {
        await uploadAnnotation(
          apiKey,
          project,
          uploadedImageId,
          image,
          groupedAnnotations.get(image.id) ?? [],
          manifest.categories,
        );
        counts[split].uploaded += 1;
      } catch (error) {
        counts[split].failed += 1;
        errors.push({
          split,
          filename: image.file_name,
          stage: 'annotation',
          message: error instanceof Error ? error.message : String(error),
        });
      }
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  let versionNumber: number | null = null;
  let trainingJobId: string | null = null;
  if (generateVersionEnabled) {
    console.log('[Roboflow] Waiting 30s for Roboflow ingestion...');
    await sleep(30_000);
    console.log('[Roboflow] Generating dataset version...');
    versionNumber = await generateVersion(apiKey, workspace, project);
    console.log(`[Roboflow] Waiting for version ${versionNumber} generation...`);
    await waitForVersion(apiKey, workspace, project, versionNumber);
    console.log(`[Roboflow] Version ${versionNumber} is ready.`);

    if (trainEnabled) {
      trainingJobId = await triggerTraining(apiKey, workspace, project, versionNumber);
      console.log(`[Roboflow] Training queued. Job ID: ${trainingJobId}`);
    }
  } else {
    console.log('Upload complete. To generate a version and train:');
    console.log('1. Open app.roboflow.com/jose-acevedo/codecomply');
    console.log('2. Click Generate New Version');
    console.log('3. Select train/valid/test split');
    console.log('4. Click Train Model');
  }

  writeUploadReport(reportPath, workspace, project, counts, errors, versionNumber, trainingJobId);
  console.log(`[Roboflow] Report written: ${reportPath}`);
}

main().catch(error => {
  console.error('[Roboflow] Fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
