/**
 * Professional Credential Verification Service
 *
 * Performs live registry lookups for Canadian professional engineers and architects.
 * IMPORTANT: Check robots.txt for each registry before enabling its scraper.
 * If disallowed or unavailable, falls back to pending_manual status.
 */

import crypto from 'crypto';
import PQueue from 'p-queue';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CredentialInput {
  licenseNumber: string;
  fullName: string;
  province: 'AB' | 'BC' | 'ON';
  discipline: 'engineer' | 'architect';
}

export interface VerificationResult {
  status: 'verified' | 'not_found' | 'suspended' | 'error' | 'pending_manual';
  verifiedName: string | null;
  registryName: string;
  nameMatchScore: number;
  rawResponseHash: string;
  checkedAt: string;
  message?: string;
}

// ─── Registry map ─────────────────────────────────────────────────────────────

type Province = 'AB' | 'BC' | 'ON';
type Discipline = 'engineer' | 'architect';

const REGISTRY_MAP: Record<Province, Record<Discipline, string>> = {
  AB: { engineer: 'APEGA', architect: 'AAA' },
  BC: { engineer: 'EGBC', architect: 'AIBC' },
  ON: { engineer: 'PEO', architect: 'OAA' },
};

// ─── Rate-limited queues (one per registry) ───────────────────────────────────

const queues: Record<string, PQueue> = {};

function getQueue(registry: string): PQueue {
  if (!queues[registry]) {
    queues[registry] = new PQueue({ concurrency: 1, intervalCap: 1, interval: 10_000 });
  }
  return queues[registry];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function nameMatchScore(input: string, registry: string): number {
  const a = input.toLowerCase().trim();
  const b = registry.toLowerCase().trim();
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── APEGA scraper ────────────────────────────────────────────────────────────

async function scrapeApega(input: CredentialInput): Promise<VerificationResult> {
  const registryName = 'APEGA';
  const checkedAt = new Date().toISOString();

  // Check robots.txt first
  try {
    const { chromium } = await import('@playwright/test');

    // Verify robots.txt allows scraping
    const robotsResponse = await fetch('https://www.apega.ca/robots.txt', {
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null);

    if (robotsResponse) {
      const robotsText = await robotsResponse.text().catch(() => '');
      const lines = robotsText.split('\n').map((l) => l.trim().toLowerCase());
      let userAgentApplies = false;
      for (const line of lines) {
        if (line.startsWith('user-agent:')) {
          const agent = line.replace('user-agent:', '').trim();
          userAgentApplies = agent === '*' || agent === 'codecomply';
        }
        if (userAgentApplies && line.startsWith('disallow:')) {
          const path = line.replace('disallow:', '').trim();
          if (path === '/' || path === '/members' || path === '/members/') {
            return {
              status: 'pending_manual',
              verifiedName: null,
              registryName,
              nameMatchScore: 0,
              rawResponseHash: sha256('robots_disallowed'),
              checkedAt,
              message: 'APEGA robots.txt disallows automated lookup. Manual verification required.',
            };
          }
        }
      }
    }

    // Launch headless browser and perform lookup
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);

      await page.goto('https://www.apega.ca/members/member-directory', {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });

      // Search by license number
      const searchInput = page.locator('input[type="search"], input[name*="search"], input[placeholder*="search" i], input[placeholder*="license" i], input[placeholder*="member" i]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill(input.licenseNumber);
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      }

      // Try to extract result name from results table / list
      const resultText = await page.locator('table tbody tr, .member-result, .directory-result, [class*="result"]').first().textContent({ timeout: 5_000 }).catch(() => null);

      const rawHash = sha256(resultText ?? 'no_result');

      if (!resultText) {
        await browser.close();
        return {
          status: 'not_found',
          verifiedName: null,
          registryName,
          nameMatchScore: 0,
          rawResponseHash: rawHash,
          checkedAt,
          message: `License number ${input.licenseNumber} not found in APEGA directory.`,
        };
      }

      // Extract name from result text (heuristic: first line or first cell)
      const extractedName = resultText.split('\n').map((s) => s.trim()).find((s) => s.length > 2) ?? resultText.trim();
      const score = nameMatchScore(input.fullName, extractedName);

      await browser.close();

      if (score >= 0.75) {
        return {
          status: 'verified',
          verifiedName: extractedName,
          registryName,
          nameMatchScore: score,
          rawResponseHash: rawHash,
          checkedAt,
        };
      } else {
        return {
          status: 'not_found',
          verifiedName: extractedName,
          registryName,
          nameMatchScore: score,
          rawResponseHash: rawHash,
          checkedAt,
          message: `Name mismatch: submitted "${input.fullName}" but registry shows "${extractedName}" (match score: ${(score * 100).toFixed(0)}%). Verify your name matches the registry exactly.`,
        };
      }
    } catch (innerErr) {
      await browser.close().catch(() => {});
      throw innerErr;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('exceeded');
    return {
      status: isTimeout ? 'error' : 'error',
      verifiedName: null,
      registryName,
      nameMatchScore: 0,
      rawResponseHash: sha256(message),
      checkedAt,
      message: isTimeout
        ? 'APEGA lookup timed out (15s). Please try again or proceed with manual verification.'
        : `APEGA lookup failed: ${message}`,
    };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function verifyCredential(input: CredentialInput): Promise<VerificationResult> {
  const registryName = REGISTRY_MAP[input.province][input.discipline];
  const checkedAt = new Date().toISOString();

  try {
    if (registryName === 'APEGA') {
      const queue = getQueue(registryName);
      const result = await Promise.race([
        queue.add(() => scrapeApega(input)) as Promise<VerificationResult>,
        new Promise<VerificationResult>((_, reject) =>
          setTimeout(() => reject(new Error('Overall timeout exceeded')), 15_000)
        ),
      ]);
      return result;
    }

    // All other registries return pending_manual immediately
    return {
      status: 'pending_manual',
      verifiedName: null,
      registryName,
      nameMatchScore: 0,
      rawResponseHash: sha256(`pending_manual_${registryName}_${input.licenseNumber}`),
      checkedAt,
      message: `${registryName} automated lookup is not yet available. Your credential will be verified manually within 1–2 business days.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'error',
      verifiedName: null,
      registryName,
      nameMatchScore: 0,
      rawResponseHash: sha256(message),
      checkedAt,
      message: `Verification error: ${message}`,
    };
  }
}
