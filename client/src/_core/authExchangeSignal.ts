type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function onExchangeFailed(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyExchangeFailed(): void {
  listeners.forEach((fn) => fn());
}
