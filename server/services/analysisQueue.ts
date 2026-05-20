/**
 * Analysis Queue
 *
 * Wraps p-queue to serialize multi-page PDF analysis requests.
 * Concurrency 3 prevents simultaneous heavy Claude Vision calls.
 */

import PQueue from "p-queue";

const CONCURRENCY = 3;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per page

export const analysisQueue = new PQueue({ concurrency: CONCURRENCY, timeout: TIMEOUT_MS });

/**
 * Enqueue a page analysis task and return its result.
 * Throws if the queue times out or the task errors.
 */
export async function queuePageAnalysis<T>(
  task: () => Promise<T>,
): Promise<T> {
  const result = await analysisQueue.add(task);
  if (result === undefined) {
    throw new Error("Analysis task returned undefined — possible queue timeout");
  }
  return result;
}
