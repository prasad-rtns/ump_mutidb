const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const workspaceRequire = createRequire(path.join(process.cwd(), 'package.json'));
const mssql = workspaceRequire('mssql');
const dotenv = workspaceRequire('dotenv');

dotenv.config();

function resolveConnectionTarget() {
  const rawHost = process.env.MSSQL_MIGRATE_HOST || process.env.MSSQL_HOST || 'localhost';
  const rawPort = process.env.MSSQL_MIGRATE_PORT || process.env.MSSQL_PORT || '1433';

  // When migrations are launched from the host machine, the Docker-internal
  // hostname `mssql` is not resolvable. Use the published local port instead.
  if (rawHost === 'mssql') {
    return { host: 'localhost', port: 1435 };
  }

  return { host: rawHost, port: parseInt(rawPort, 10) };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : 'true';
    if (args[key] === next) i += 1;
  }
  return args;
}

function splitBatches(sql) {
  return sql
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function ensureMigrationsTable(pool) {
  await pool
    .request()
    .batch(`
      IF OBJECT_ID(N'dbo.__schema_migrations', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.__schema_migrations (
          filename NVARCHAR(255) NOT NULL PRIMARY KEY,
          applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END
    `);
}

async function getAppliedMigrations(pool) {
  const result = await pool
    .request()
    .query('SELECT filename FROM dbo.__schema_migrations');
  return new Set(result.recordset.map((row) => row.filename));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const migrationsDir = args.dir
    ? path.resolve(process.cwd(), args.dir)
    : path.resolve(process.cwd(), 'src/database/migrations/mssql');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const target = resolveConnectionTarget();
  const config = {
    server: target.host,
    port: target.port,
    database: process.env.MSSQL_MIGRATE_DB || process.env.MSSQL_DB || 'master',
    user: process.env.MSSQL_MIGRATE_USER || process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_MIGRATE_PASSWORD || process.env.MSSQL_PASSWORD || '',
    options: {
      encrypt: true,
      trustServerCertificate:
        process.env.MSSQL_TRUST_CERT === 'true' || process.env.NODE_ENV !== 'production',
      enableArithAbort: true,
    },
    pool: {
      min: 1,
      max: 5,
      idleTimeoutMillis: 30000,
    },
  };

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log(`No MSSQL migration files found in ${migrationsDir}`);
    return;
  }

  const pool = await new mssql.ConnectionPool(config).connect();

  try {
    await ensureMigrationsTable(pool);
    const applied = await getAppliedMigrations(pool);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const batches = splitBatches(sql);

      console.log(`Applying ${file}`);
      for (const batch of batches) {
        await pool.request().batch(batch);
      }

      await pool
        .request()
        .input('filename', mssql.NVarChar(255), file)
        .query(
          'INSERT INTO dbo.__schema_migrations (filename, applied_at) VALUES (@filename, SYSUTCDATETIME())'
        );
    }
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
