/**
 * Document Preprocessing Service
 *
 * Rasterizes PDF pages at 150 DPI using pdfjs-dist + canvas,
 * compresses via sharp, uploads pages to storage, and records
 * page metadata in the drawingPages table.
 *
 * Returns page-0 base64 for immediate Claude Vision analysis.
 */

import * as pdfjsLib from "pdfjs-dist";
import { createCanvas } from "canvas";
import sharp from "sharp";
import { getDb } from "../db";
import { drawingAnalyses, drawingPages } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";

// Node.js canvas factory for pdfjs-dist — passed to getDocument(), not render()
const nodeCanvasFactory = {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  },
  reset(canvasAndContext: { canvas: ReturnType<typeof createCanvas> }, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy(canvasAndContext: { canvas: ReturnType<typeof createCanvas> }) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  },
};

export interface PreprocessedPage {
  pageNumber: number;   // 1-based
  base64: string;       // JPEG base64 for Claude Vision
  mimeType: "image/jpeg";
  widthPx: number;
  heightPx: number;
  storageUrl: string;
}

export interface PreprocessResult {
  drawingId: number;
  pageCount: number;
  pages: PreprocessedPage[];
}

const DPI = 150;
const POINTS_PER_INCH = 72;
const SCALE = DPI / POINTS_PER_INCH;
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB Anthropic limit

/**
 * Compress a JPEG buffer to stay under MAX_BYTES, reducing quality iteratively.
 */
async function compressToLimit(pngBuffer: Buffer): Promise<Buffer> {
  let quality = 85;
  let result = await sharp(pngBuffer).jpeg({ quality }).toBuffer();
  while (result.length > MAX_BYTES && quality > 20) {
    quality -= 10;
    result = await sharp(pngBuffer).jpeg({ quality }).toBuffer();
  }
  return result;
}

/**
 * Rasterize a single PDF page and return the JPEG Buffer + dimensions.
 */
async function rasterizePage(
  pdfDoc: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>,
  pageNum: number,
): Promise<{ buffer: Buffer; widthPx: number; heightPx: number }> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: SCALE });

  const widthPx = Math.ceil(viewport.width);
  const heightPx = Math.ceil(viewport.height);

  const canvasAndContext = nodeCanvasFactory.create(widthPx, heightPx);
  const { canvas, context } = canvasAndContext;

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;

  page.cleanup();

  const pngBuffer = canvas.toBuffer("image/png");
  nodeCanvasFactory.destroy(canvasAndContext);

  const jpegBuffer = await compressToLimit(pngBuffer);
  return { buffer: jpegBuffer, widthPx, heightPx };
}

/**
 * Preprocess a PDF: rasterize all pages, upload each to storage,
 * insert drawingPages rows, update drawingAnalyses uploadStatus.
 *
 * @param drawingId  - DB id of the drawingAnalyses row
 * @param userId     - owner (used in storage key path)
 * @param pdfBuffer  - raw PDF bytes
 */
export async function preprocessDocument(
  drawingId: number,
  userId: number,
  pdfBuffer: Buffer,
): Promise<PreprocessResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Transition to processing
  await db
    .update(drawingAnalyses)
    .set({ uploadStatus: "processing" })
    .where(eq(drawingAnalyses.id, drawingId));

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      // Disable worker in Node.js — pdfjs runs synchronously
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      canvasFactory: nodeCanvasFactory,
    });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    const pages: PreprocessedPage[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const { buffer, widthPx, heightPx } = await rasterizePage(pdfDoc, pageNum);

      // Upload rasterized page to storage
      const storageKey = `drawing-pages/${userId}/${drawingId}/page-${pageNum}.jpg`;
      let storageUrl = "";
      try {
        const uploaded = await storagePut(storageKey, buffer, "image/jpeg");
        storageUrl = uploaded.url;
      } catch (err) {
        console.error(`[Preprocess] Storage upload failed for page ${pageNum}:`, err);
        // Continue — page still usable for analysis via base64
      }

      // Persist page metadata
      await db.insert(drawingPages).values({
        drawingId,
        pageNumber: pageNum,
        widthPx,
        heightPx,
        preprocessedUrl: storageUrl || null,
      });

      pages.push({
        pageNumber: pageNum,
        base64: buffer.toString("base64"),
        mimeType: "image/jpeg",
        widthPx,
        heightPx,
        storageUrl,
      });
    }

    pdfDoc.destroy();

    // Update drawingAnalyses with final page count and complete status
    await db
      .update(drawingAnalyses)
      .set({ pageCount, uploadStatus: "complete", fileType: "pdf" })
      .where(eq(drawingAnalyses.id, drawingId));

    return { drawingId, pageCount, pages };
  } catch (err) {
    // Transition to error state
    await db
      .update(drawingAnalyses)
      .set({ uploadStatus: "error" })
      .where(eq(drawingAnalyses.id, drawingId));
    throw err;
  }
}
