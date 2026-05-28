/**
 * Wall Engine Queue — Phase B6
 *
 * PQueue concurrency=1 for CPU-intensive wall extraction.
 * Shared singleton — all pages queue through the same worker.
 */

import PQueue from "p-queue";

export const wallEngineQueue = new PQueue({ concurrency: 1 });
