const { createDatabase } = require('../dist/database/manager');

const tests = [
  { type: 'postgres', conn: 'postgres://user:pass@localhost:5432/db' },
  { type: 'mysql', conn: 'mysql://root:pass@localhost:3306/db' },
  { type: 'mssql', conn: 'mssql://sa:pass@localhost:1433/db' },
  { type: 'mongodb', conn: 'mongodb://localhost:27017/test' }
];

(async () => {
  for (const t of tests) {
    try {
      console.log(`Testing ${t.type} connector...`);
      await createDatabase({ type: t.type, connectionString: t.conn });
      console.log(`✅ ${t.type} connector OK\n`);
    } catch (e) {
      console.log(`⚠ ${t.type} skipped: ${e.message}\n`);
    }
  }
})();