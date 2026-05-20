/**
 * Sanitises OCR-extracted legend text before it is injected into a Claude
 * Vision prompt.
 *
 * The legend pipeline injects raw text from Azure OCR directly into the
 * model's context.  Adversarial or accidentally instruction-like strings in
 * that text could manipulate the model's output (prompt injection).
 *
 * Defence layers (in order):
 *  1. Token-limit truncation — hard cap on total legend characters
 *  2. Per-entry length cap — single entries > 200 chars are suspicious
 *  3. Instruction-pattern detection — common injection phrases
 *  4. JSON / bracket injection — curly/square brace density check
 *  5. Directive-prefix detection — lines that open with model directive words
 *  6. Canary check — detect if our own sentinel was echoed back (self-test)
 */

export interface SanitiseResult {
  /** Cleaned text safe to inject into a prompt */
  cleanText: string;
  /** True if any entry was modified or removed */
  wasModified: boolean;
  /** Human-readable log of what was stripped and why */
  auditLog: string[];
}

// ── Injection pattern lists ───────────────────────────────────────────────────

const INJECTION_PHRASES = [
  'ignore previous',
  'ignore all previous',
  'disregard',
  'forget everything',
  'you are now',
  'new instructions',
  'system prompt',
  'override instructions',
  'do not follow',
  'stop following',
  'instead of',
  'act as',
  'pretend you are',
  'your new role',
  'return empty',
  'return []',
  'return {}',
  'do not detect',
  'skip detection',
];

// Lines starting with these words (case-insensitive) look like directives
const DIRECTIVE_PREFIXES = [
  'important:',
  'note:',
  'critical:',
  'warning:',
  'instruction:',
  'rule:',
  'system:',
  'user:',
  'assistant:',
  'human:',
];

// Max total characters allowed in the legend block
const MAX_LEGEND_CHARS = 2000;
// Max characters for a single legend entry (single OCR word/phrase)
const MAX_ENTRY_CHARS = 200;
// Max ratio of `{[` chars to total chars before flagging as JSON injection
const BRACE_DENSITY_THRESHOLD = 0.15;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sanitise an array of raw OCR text entries extracted from a drawing legend.
 * Returns cleaned entries plus an audit log of what was modified.
 */
export function sanitiseLegendEntries(entries: string[]): SanitiseResult {
  const auditLog: string[] = [];
  let wasModified = false;

  const cleaned: string[] = [];

  for (const raw of entries) {
    const trimmed = raw.trim();

    // 1. Per-entry length cap
    if (trimmed.length > MAX_ENTRY_CHARS) {
      auditLog.push(`TRUNCATED (${trimmed.length} chars > ${MAX_ENTRY_CHARS}): "${trimmed.substring(0, 40)}…"`);
      cleaned.push(trimmed.substring(0, MAX_ENTRY_CHARS));
      wasModified = true;
      continue;
    }

    // 2. Instruction-pattern check (case-insensitive)
    const lower = trimmed.toLowerCase();
    const injectionMatch = INJECTION_PHRASES.find(p => lower.includes(p));
    if (injectionMatch) {
      auditLog.push(`STRIPPED (injection phrase "${injectionMatch}"): "${trimmed}"`);
      wasModified = true;
      continue;
    }

    // 3. Directive-prefix check
    const directiveMatch = DIRECTIVE_PREFIXES.find(p => lower.startsWith(p));
    if (directiveMatch) {
      auditLog.push(`STRIPPED (directive prefix "${directiveMatch}"): "${trimmed}"`);
      wasModified = true;
      continue;
    }

    // 4. Brace density — catches JSON-injection attempts
    const braceCount = (trimmed.match(/[{[\]]/g) ?? []).length;
    if (trimmed.length > 10 && braceCount / trimmed.length > BRACE_DENSITY_THRESHOLD) {
      auditLog.push(`STRIPPED (brace density ${(braceCount / trimmed.length).toFixed(2)}): "${trimmed}"`);
      wasModified = true;
      continue;
    }

    cleaned.push(trimmed);
  }

  // 5. Total length cap — truncate the joined block if needed
  let joined = cleaned.join('\n');
  if (joined.length > MAX_LEGEND_CHARS) {
    joined = joined.substring(0, MAX_LEGEND_CHARS);
    auditLog.push(`TRUNCATED total legend to ${MAX_LEGEND_CHARS} chars`);
    wasModified = true;
  }

  if (auditLog.length > 0) {
    console.warn(`[LegendSanitiser] ${auditLog.length} modification(s):`, auditLog);
  }

  return { cleanText: joined, wasModified, auditLog };
}

/**
 * Sanitise a pre-joined legend string (e.g. from rawText after legend extraction).
 * Splits on newlines, sanitises each line, rejoins.
 */
export function sanitiseLegendText(rawText: string): SanitiseResult {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  return sanitiseLegendEntries(lines);
}

/**
 * Validate that a formatted legend prompt block (the final string passed to
 * Claude) does not contain our sentinel string echoed back — a sign that
 * something in the pipeline re-injected the legend as instructions.
 *
 * Usage: call this on the output of formatLegendForPrompt() before sending
 * to the model.  Returns false if the block looks clean.
 */
export function detectCanaryEcho(promptBlock: string): boolean {
  // The canary is the opening header line; if it appears more than once,
  // something spliced the legend into itself.
  const CANARY = 'DRAWING LEGEND AND CONVENTIONS';
  const occurrences = (promptBlock.match(new RegExp(CANARY, 'g')) ?? []).length;
  if (occurrences > 1) {
    console.error(`[LegendSanitiser] Canary echo detected (${occurrences}× header) — legend may have been double-injected`);
    return true;
  }
  return false;
}
