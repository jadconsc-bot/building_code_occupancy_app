/**
 * DEV-ONLY TEST UTILITY — seeds and cleans up synthetic rows in
 * calculationResults / calculationAuditLog for manual UI verification.
 *
 * WARNING: As of Phase 1, .env.local points at the SAME Railway
 * database used in production (see CLAUDE_SENIOR_CONTEXT). This
 * script targets that database. Test rows are marked with
 * "[TEST-SEED]" in the audit log `details` field; cleanup ONLY
 * deletes rows matching that marker — never a broad DELETE.
 *
 * Usage:
 *   pnpm tsx scripts/seed-test-calculation.ts --seed
 *   pnpm tsx scripts/seed-test-calculation.ts --cleanup
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { CalculationEngine } from '../server/calculationEngine';
import { getDb } from '../server/db';
import { calculationResults, calculationAuditLog } from '../drizzle/schema';
import { like, eq } from 'drizzle-orm';

const TEST_MARKER = '[TEST-SEED]';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (prefix: string) => {
    const match = args.find(a => a.startsWith(prefix));
    return match ? match.slice(prefix.length) : undefined;
  };
  return {
    seed:           args.includes('--seed'),
    cleanup:        args.includes('--cleanup'),
    projectId:      get('--projectId='),
    userId:         get('--userId='),
    calculatorType: get('--calculatorType=') ?? 'beamSpan',
    inputs:         get('--inputs='),
    outputs:        get('--outputs='),
  };
}

function printUsage() {
  console.log(`
Usage:
  pnpm tsx scripts/seed-test-calculation.ts --seed --projectId=<id> --userId=<id> [--calculatorType=beamSpan] [--inputs='{}'] [--outputs='{}']
  pnpm tsx scripts/seed-test-calculation.ts --cleanup
`);
}

async function seed(opts: ReturnType<typeof parseArgs>) {
  if (!opts.projectId || !opts.userId) {
    console.error('Error: --projectId and --userId are required for --seed.');
    printUsage();
    process.exit(1);
  }

  const projectId = parseInt(opts.projectId, 10);
  const userId    = parseInt(opts.userId, 10);

  if (isNaN(projectId) || isNaN(userId)) {
    console.error('Error: --projectId and --userId must be integers.');
    process.exit(1);
  }

  const defaultInputs  = { selectedSpecies: 'Douglas Fir - Larch', selectedGrade: 'Select Structural', selectedSize: '89 x 184 mm', selectedLoading: 'One Floor' };
  const defaultOutputs = { maxSpan: 4.20 };

  const inputs  = opts.inputs  ? JSON.parse(opts.inputs)  : defaultInputs;
  const outputs = opts.outputs ? JSON.parse(opts.outputs) : defaultOutputs;

  const db = await getDb();
  if (!db) { console.error('Error: database not available.'); process.exit(1); }

  const engine    = new CalculationEngine();
  const signature = engine.signCalculation(inputs, outputs, userId);
  const calcId    = randomUUID();
  const auditId   = randomUUID();

  await db.insert(calculationResults).values({
    id:                     calcId,
    projectId,
    userId,
    calculatorType:         opts.calculatorType,
    rulesetVersion:         '1.0',
    inputData:              JSON.stringify(inputs),
    resultData:             JSON.stringify(outputs),
    calculationTrace:       JSON.stringify({ inputs, outputs }),
    cryptographicSignature: signature,
    signatureVerified:      false,
    createdAt:              new Date(),
    createdBy:              userId,
    ipAddress:              '127.0.0.1',
    userAgent:              'seed-test-calculation/1.0',
    immutable:              true,
  } as any);

  await db.insert(calculationAuditLog).values({
    id:                  auditId,
    calculationResultId: calcId,
    action:              'CREATE',
    actor:               userId,
    timestamp:           new Date(),
    details:             `${TEST_MARKER} ${opts.calculatorType} test row for manual verification`,
  } as any);

  console.log(`Created test row: ${calcId} — view at /calculation-history`);
  process.exit(0);
}

async function cleanup() {
  const db = await getDb();
  if (!db) { console.error('Error: database not available.'); process.exit(1); }

  const auditRows = await db
    .select({ id: calculationAuditLog.id, calculationResultId: calculationAuditLog.calculationResultId })
    .from(calculationAuditLog)
    .where(like(calculationAuditLog.details, `${TEST_MARKER}%`));

  if (auditRows.length === 0) {
    console.log('No test-seed rows found — nothing to clean up.');
    process.exit(0);
  }

  let auditDeleted = 0;
  let resultDeleted = 0;

  for (const row of auditRows) {
    const [ad] = await db
      .delete(calculationAuditLog)
      .where(eq(calculationAuditLog.id, row.id));
    auditDeleted += (ad as any).affectedRows ?? 1;

    const [rd] = await db
      .delete(calculationResults)
      .where(eq(calculationResults.id, row.calculationResultId));
    resultDeleted += (rd as any).affectedRows ?? 1;
  }

  console.log(`Deleted ${auditDeleted} calculationAuditLog row(s) and ${resultDeleted} calculationResults row(s).`);
  process.exit(0);
}

async function main() {
  const opts = parseArgs();

  if ((opts.seed && opts.cleanup) || (!opts.seed && !opts.cleanup)) {
    console.error('Error: pass exactly one of --seed or --cleanup.');
    printUsage();
    process.exit(1);
  }

  if (opts.seed)    await seed(opts);
  if (opts.cleanup) await cleanup();
}

main().catch(e => { console.error(e); process.exit(1); });
