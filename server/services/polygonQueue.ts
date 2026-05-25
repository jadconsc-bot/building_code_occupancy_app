import PQueue from 'p-queue';

export const polygonQueue = new PQueue({
  concurrency: 2,
  timeout: 30_000,
});
