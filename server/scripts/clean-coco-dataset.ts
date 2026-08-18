/**
 * Clean the public FloorPlan-RoomType COCO Segmentation dataset for use as
 * CodeComply room-boundary pretraining data.
 *
 * Usage:
 *   npx ts-node server/scripts/clean-coco-dataset.ts
 *
 * This script never writes into the repository. It reads from Downloads and
 * recreates a separate cleaned output directory on every run.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const USER_HOME = process.env.HOME || '/Users/josedeoleo';
const INPUT_ROOT = path.join(
  USER_HOME,
  'Downloads',
  'FloorPlan-RoomType-segmentation.v1i.coco-segmentation',
);
const OUTPUT_ROOT = path.join(
  USER_HOME,
  'Downloads',
  'codecomply-training-clean',
);
const SPLITS = ['train', 'valid', 'test'] as const;

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
  [key: string]: unknown;
}

interface SplitSummary {
  originalImages: number;
  removedUnannotated: number;
  removedSplitLeak: number;
  removedMissingFile: number;
  finalImages: number;
  originalAnnotations: number;
  finalAnnotations: number;
  leakedFilesRemoved: string[];
  missingFiles: string[];
}

interface ValidationSummary {
  referencedImagesExist: boolean;
  annotationsReferenceValidImages: boolean;
  onlyCategoryOne: boolean;
  noCrossSplitImages: boolean;
  errors: string[];
}

const CLEAN_CATEGORY: CocoCategory = {
  id: 1,
  name: 'room',
  supercategory: 'room',
};

function readManifest(split: Split): CocoManifest {
  const manifestPath = path.join(INPUT_ROOT, split, '_annotations.coco.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing source manifest: ${manifestPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CocoManifest;
  if (!Array.isArray(parsed.images) || !Array.isArray(parsed.annotations) || !Array.isArray(parsed.categories)) {
    throw new Error(`Invalid COCO manifest structure: ${manifestPath}`);
  }
  return parsed;
}

function sourceKey(fileName: string): string {
  return fileName.split('.rf.')[0].toLowerCase();
}

function recreateOutputRoot(): void {
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  for (const split of SPLITS) {
    fs.mkdirSync(path.join(OUTPUT_ROOT, split), { recursive: true });
  }
}

function validateOutput(): ValidationSummary {
  const errors: string[] = [];
  const seenSourceKeys = new Map<string, Split>();
  let referencedImagesExist = true;
  let annotationsReferenceValidImages = true;
  let onlyCategoryOne = true;
  let noCrossSplitImages = true;

  for (const split of SPLITS) {
    const manifestPath = path.join(OUTPUT_ROOT, split, '_annotations.coco.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CocoManifest;
    const imageIds = new Set(manifest.images.map(image => image.id));

    for (const image of manifest.images) {
      const imagePath = path.join(OUTPUT_ROOT, split, image.file_name);
      if (!fs.existsSync(imagePath)) {
        referencedImagesExist = false;
        errors.push(`${split}: referenced image is missing: ${image.file_name}`);
      }

      const key = sourceKey(image.file_name);
      const priorSplit = seenSourceKeys.get(key);
      if (priorSplit && priorSplit !== split) {
        noCrossSplitImages = false;
        errors.push(`${image.file_name}: source appears in both ${priorSplit} and ${split}`);
      } else {
        seenSourceKeys.set(key, split);
      }
    }

    for (const annotation of manifest.annotations) {
      if (!imageIds.has(annotation.image_id)) {
        annotationsReferenceValidImages = false;
        errors.push(`${split}: annotation ${annotation.id} references missing image_id ${annotation.image_id}`);
      }
      if (annotation.category_id !== 1) {
        onlyCategoryOne = false;
        errors.push(`${split}: annotation ${annotation.id} has category_id ${annotation.category_id}`);
      }
    }

    if (
      manifest.categories.length !== 1 ||
      manifest.categories[0]?.id !== 1 ||
      manifest.categories[0]?.name !== 'room'
    ) {
      onlyCategoryOne = false;
      errors.push(`${split}: categories array is not the single normalized room category`);
    }
  }

  return {
    referencedImagesExist,
    annotationsReferenceValidImages,
    onlyCategoryOne,
    noCrossSplitImages,
    errors,
  };
}

function resultLabel(value: boolean): string {
  return value ? 'PASS' : 'FAIL';
}

function writeReport(
  summaries: Record<Split, SplitSummary>,
  originalCategories: string[],
  validation: ValidationSummary,
  anomalies: string[],
): void {
  const lines = [
    '# COCO Dataset Cleaning Report',
    '',
    `- Cleaning timestamp: ${new Date().toISOString()}`,
    `- Input: \`${INPUT_ROOT}\``,
    `- Output: \`${OUTPUT_ROOT}\``,
    '',
    '## Split Summary',
    '',
    '| Split | Original images | Unannotated removed | Split leaks removed | Missing files skipped | Final images | Original annotations | Final annotations |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...SPLITS.map(split => {
      const item = summaries[split];
      return `| ${split} | ${item.originalImages} | ${item.removedUnannotated} | ${item.removedSplitLeak} | ${item.removedMissingFile} | ${item.finalImages} | ${item.originalAnnotations} | ${item.finalAnnotations} |`;
    }),
    '',
    '## Category Mapping',
    '',
    'All source annotation categories were collapsed into:',
    '',
    '```json',
    JSON.stringify([CLEAN_CATEGORY], null, 2),
    '```',
    '',
    `Source categories encountered: ${originalCategories.map(name => `\`${name}\``).join(', ')}`,
    '',
    '## Removed Split Leaks',
    '',
    ...SPLITS.flatMap(split => {
      const files = summaries[split].leakedFilesRemoved;
      return files.length > 0
        ? files.map(file => `- ${split}: \`${file}\``)
        : [`- ${split}: none`];
    }),
    '',
    '## Anomalies',
    '',
    ...(anomalies.length > 0 ? anomalies.map(item => `- ${item}`) : ['- None']),
    '',
    '## Validation',
    '',
    `- Referenced image files exist: **${resultLabel(validation.referencedImagesExist)}**`,
    `- Annotations reference valid image IDs: **${resultLabel(validation.annotationsReferenceValidImages)}**`,
    `- Only category ID 1 exists: **${resultLabel(validation.onlyCategoryOne)}**`,
    `- No source image appears in multiple splits: **${resultLabel(validation.noCrossSplitImages)}**`,
    '',
    ...(validation.errors.length > 0
      ? ['### Validation Errors', '', ...validation.errors.map(error => `- ${error}`), '']
      : ['All output validation checks passed.', '']),
  ];

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'CLEANING_REPORT.md'), `${lines.join('\n')}\n`, 'utf8');
}

function main(): void {
  console.log(`[COCO Clean] Input:  ${INPUT_ROOT}`);
  console.log(`[COCO Clean] Output: ${OUTPUT_ROOT}`);

  if (!fs.existsSync(INPUT_ROOT)) {
    throw new Error(`Input dataset directory does not exist: ${INPUT_ROOT}`);
  }

  const sourceManifests = Object.fromEntries(
    SPLITS.map(split => [split, readManifest(split)]),
  ) as Record<Split, CocoManifest>;
  const originalCategories = Array.from(new Set(
    SPLITS.flatMap(split => sourceManifests[split].categories.map(category => category.name)),
  )).sort((a, b) => a.localeCompare(b));

  recreateOutputRoot();

  // Split precedence is deliberate: the known train/valid leak remains in train.
  const retainedSourceKeys = new Map<string, Split>();
  const summaries = {} as Record<Split, SplitSummary>;
  const anomalies: string[] = [];

  for (const split of SPLITS) {
    console.log(`[COCO Clean] Processing ${split}...`);
    const manifest = sourceManifests[split];
    const annotationsByImage = new Map<number, CocoAnnotation[]>();
    for (const annotation of manifest.annotations) {
      const list = annotationsByImage.get(annotation.image_id) ?? [];
      list.push(annotation);
      annotationsByImage.set(annotation.image_id, list);
    }

    const retainedImages: CocoImage[] = [];
    const retainedAnnotations: CocoAnnotation[] = [];
    const leakedFilesRemoved: string[] = [];
    const missingFiles: string[] = [];
    let removedUnannotated = 0;
    let removedSplitLeak = 0;
    let nextImageId = 1;
    let nextAnnotationId = 1;

    for (const image of manifest.images) {
      const imageAnnotations = annotationsByImage.get(image.id) ?? [];
      if (imageAnnotations.length === 0) {
        removedUnannotated += 1;
        continue;
      }

      const key = sourceKey(image.file_name);
      const existingSplit = retainedSourceKeys.get(key);
      if (existingSplit && existingSplit !== split) {
        removedSplitLeak += 1;
        leakedFilesRemoved.push(image.file_name);
        continue;
      }

      const sourceImagePath = path.join(INPUT_ROOT, split, image.file_name);
      if (!fs.existsSync(sourceImagePath)) {
        console.warn(`[COCO Clean] WARNING: missing source image, skipping: ${sourceImagePath}`);
        missingFiles.push(image.file_name);
        continue;
      }

      const newImageId = nextImageId++;
      retainedImages.push({ ...image, id: newImageId });
      for (const annotation of imageAnnotations) {
        retainedAnnotations.push({
          ...annotation,
          id: nextAnnotationId++,
          image_id: newImageId,
          category_id: 1,
        });
      }

      fs.copyFileSync(sourceImagePath, path.join(OUTPUT_ROOT, split, image.file_name));
      retainedSourceKeys.set(key, split);
    }

    const cleanedManifest: CocoManifest = {
      ...manifest,
      images: retainedImages,
      annotations: retainedAnnotations,
      categories: [CLEAN_CATEGORY],
    };
    fs.writeFileSync(
      path.join(OUTPUT_ROOT, split, '_annotations.coco.json'),
      `${JSON.stringify(cleanedManifest, null, 2)}\n`,
      'utf8',
    );

    summaries[split] = {
      originalImages: manifest.images.length,
      removedUnannotated,
      removedSplitLeak,
      removedMissingFile: missingFiles.length,
      finalImages: retainedImages.length,
      originalAnnotations: manifest.annotations.length,
      finalAnnotations: retainedAnnotations.length,
      leakedFilesRemoved,
      missingFiles,
    };

    if (missingFiles.length > 0) {
      anomalies.push(`${split}: ${missingFiles.length} manifest image file(s) were missing and skipped.`);
    }
    console.log(
      `[COCO Clean] ${split}: ${manifest.images.length} -> ${retainedImages.length} images; ` +
      `${manifest.annotations.length} -> ${retainedAnnotations.length} annotations`,
    );
  }

  const manifestImageTotal = SPLITS.reduce(
    (sum, split) => sum + sourceManifests[split].images.length,
    0,
  );
  if (manifestImageTotal !== 3301) {
    anomalies.push(
      `Dataset README claims 3301 images, but the source COCO manifests contain ${manifestImageTotal}.`,
    );
  }

  const validation = validateOutput();
  writeReport(summaries, originalCategories, validation, anomalies);

  console.log('[COCO Clean] Validation:');
  console.log(`  referenced images exist: ${resultLabel(validation.referencedImagesExist)}`);
  console.log(`  annotation image IDs valid: ${resultLabel(validation.annotationsReferenceValidImages)}`);
  console.log(`  only category 1: ${resultLabel(validation.onlyCategoryOne)}`);
  console.log(`  no cross-split images: ${resultLabel(validation.noCrossSplitImages)}`);
  console.log(`[COCO Clean] Report: ${path.join(OUTPUT_ROOT, 'CLEANING_REPORT.md')}`);

  if (validation.errors.length > 0) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error('[COCO Clean] Fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
