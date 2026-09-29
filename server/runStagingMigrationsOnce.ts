import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const STAGING_HOST_MARKER = "mysql-v4a";

export async function runStagingMigrationsOnce(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes(STAGING_HOST_MARKER)) {
    console.error(
      `[StagingMigrations] Refusing to run: DATABASE_URL must contain ${STAGING_HOST_MARKER}.`,
    );
    process.exit(1);
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(moduleDir, "../drizzle/migrations");
  let connection: mysql.Connection | undefined;
  try {
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`[StagingMigrations] Found ${files.length} migration files.`);
    connection = await mysql.createConnection({ uri: dbUrl, multipleStatements: true });
    for (const file of files) {
      console.log(`[StagingMigrations] Applying ${file}`);
      try {
        const sql = await readFile(path.join(migrationsDir, file), "utf8");
        await connection.query(sql);
        console.log(`[StagingMigrations] OK: ${file}`);
      } catch (error) {
        console.error(`[StagingMigrations] FAILED: ${file}`, error);
        process.exit(1);
      }
    }

    const [tables] = await connection.query("SHOW TABLES");
    console.log("[StagingMigrations] SHOW TABLES:", tables);
  } catch (error) {
    console.error("[StagingMigrations] Boot migration failed", error);
    process.exit(1);
  } finally {
    await connection?.end();
  }
}
