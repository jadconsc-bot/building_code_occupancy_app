import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../db';
import { complianceMonitorSnapshots, complianceNotifications } from '../../drizzle/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { ENV } from '../_core/env';

const SOURCES = [
  { id: 'RAIC',     url: 'https://raic.org/resources/',                                                               jurisdiction: 'National' },
  { id: 'NRC',      url: 'https://nrc-cnrc.gc.ca/eng/publications/codes_centre',                                     jurisdiction: 'National' },
  { id: 'CBHCC',   url: 'https://cbhcc-cchcc.ca/en/significant-technical-changes-2020-national-model-codes/',        jurisdiction: 'National' },
  { id: 'STANDATA', url: 'https://www.alberta.ca/safety-codes',                                                      jurisdiction: 'AB' },
  { id: 'ABC',      url: 'https://www.alberta.ca/safety-codes',                                                      jurisdiction: 'AB' },
  { id: 'BCBC',     url: 'https://www2.gov.bc.ca/gov/content/industry/construction-industry/building-codes-standards', jurisdiction: 'BC' },
  { id: 'OBC',      url: 'https://www.ontario.ca/laws/statute/92b23',                                                jurisdiction: 'ON' },
  { id: 'SK',       url: 'https://publications.saskatchewan.ca',                                                     jurisdiction: 'SK' },
  { id: 'MB',       url: 'https://www.gov.mb.ca/housing/pubs/index.html',                                           jurisdiction: 'MB' },
  { id: 'YK',       url: 'https://yukon.ca/en/housing-and-property/building-and-renovating/building-and-renovating-information', jurisdiction: 'YK' },
] as const;

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}

async function fetchWithBrowser(url: string): Promise<{ content: string; status: number; error?: string }> {
  try {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch();
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const content = await page.content();
    const status = response?.status() ?? 0;
    await browser.close();
    return { content, status };
  } catch (err) {
    const msg = String(err);
    if (msg.includes("Executable") || msg.includes("chromium") || msg.includes("not found") || msg.includes("ENOENT")) {
      console.log("[ComplianceMonitor] Playwright not available on this instance — skipping browser-based sources");
      return { content: '', status: 0 };
    }
    return { content: '', status: 0, error: msg };
  }
}

async function fetchSource(url: string): Promise<{ content: string; status: number; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CodeComply-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    // Fall back to headless browser for bot-protected sites
    if (response.status === 403 || response.status === 429) {
      return fetchWithBrowser(url);
    }
    const content = await response.text();
    return { content, status: response.status };
  } catch (err) {
    return { content: '', status: 0, error: String(err) };
  }
}

async function analyzeChange(
  sourceId: string,
  jurisdiction: string,
  previousContent: string,
  currentContent: string,
): Promise<{
  isRelevant: boolean;
  headline: string;
  summary: string;
  affectedRuleIds: string[];
  recommendedActions: string[];
  severity: 'critical' | 'major' | 'minor' | 'info';
} | null> {
  const prompt = `You are a Canadian building code compliance expert analyzing website changes.

SOURCE: ${sourceId} (${jurisdiction})
PREVIOUS CONTENT (first 1500 chars):
${previousContent.slice(0, 1500)}

CURRENT CONTENT (first 1500 chars):
${currentContent.slice(0, 1500)}

Analyze the difference. Respond ONLY in JSON with this exact structure:
{
  "isRelevant": boolean,
  "headline": "one sentence title of the change",
  "summary": "2-3 sentence plain-English summary of what changed and why it matters",
  "affectedRuleIds": ["list of NBC/ABC/BCBC rule IDs that may be affected, e.g. NBC-3.4.2.5"],
  "recommendedActions": ["list of specific actions for the CodeComply rule engine team"],
  "severity": "critical|major|minor|info"
}

Only set isRelevant=true if the change affects:
- Building code requirements (egress, occupancy, fire safety, structural)
- Professional practice rules for engineers/architects in Canada
- Provincial amendments to NBC
- New or revised STANDATA bulletins
- Changes to occupancy classification rules

Set isRelevant=false for: navigation changes, contact info, formatting, unrelated content.`;

  try {
    const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function runComplianceMonitor(): Promise<{
  sourcesChecked: number;
  changesDetected: number;
  notificationsCreated: number;
  errors: string[];
}> {
  const results = { sourcesChecked: 0, changesDetected: 0, notificationsCreated: 0, errors: [] as string[] };

  const db = await getDb();
  if (!db) {
    results.errors.push('Database not available');
    return results;
  }

  for (const source of SOURCES) {
    try {
      results.sourcesChecked++;

      const { content, status, error } = await fetchSource(source.url);

      if (error || status < 200 || status >= 400) {
        results.errors.push(`${source.id}: ${error ?? `HTTP ${status}`}`);
        await db.insert(complianceMonitorSnapshots).values({
          sourceId: source.id,
          sourceUrl: source.url,
          contentHash: '',
          contentSample: '',
          fetchedAt: new Date(),
          httpStatus: status,
          errorMessage: error ?? `HTTP ${status}`,
        });
        continue;
      }

      const currentHash = hashContent(content);
      const currentSample = content.slice(0, 2000);

      const lastRows = await db
        .select()
        .from(complianceMonitorSnapshots)
        .where(and(eq(complianceMonitorSnapshots.sourceId, source.id), isNull(complianceMonitorSnapshots.errorMessage)))
        .orderBy(desc(complianceMonitorSnapshots.fetchedAt))
        .limit(1);
      const lastSnapshot = lastRows[0] ?? null;

      await db.insert(complianceMonitorSnapshots).values({
        sourceId: source.id,
        sourceUrl: source.url,
        contentHash: currentHash,
        contentSample: currentSample,
        fetchedAt: new Date(),
        httpStatus: status,
      });

      if (!lastSnapshot) continue;
      if (lastSnapshot.contentHash === currentHash) continue;

      results.changesDetected++;

      const analysis = await analyzeChange(
        source.id,
        source.jurisdiction,
        lastSnapshot.contentSample ?? '',
        currentSample,
      );

      if (!analysis || !analysis.isRelevant) continue;

      await db.insert(complianceNotifications).values({
        sourceId: source.id,
        sourceUrl: source.url,
        changeDetectedAt: new Date(),
        headline: analysis.headline,
        summary: analysis.summary,
        affectedRuleIds: JSON.stringify(analysis.affectedRuleIds),
        recommendedActions: JSON.stringify(analysis.recommendedActions),
        severity: analysis.severity,
        status: 'pending',
      });

      results.notificationsCreated++;

    } catch (err) {
      results.errors.push(`${source.id}: ${String(err)}`);
    }
  }

  return results;
}
