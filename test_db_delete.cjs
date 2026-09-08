const { db } = require('./src/db');
const { audit_logs } = require('./src/db/schema');
const { sql, lt } = require('drizzle-orm');

async function run() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log("Testing with sql: ", thirtyDaysAgo);
    await db.delete(audit_logs).where(sql`${audit_logs.timestamp} < ${thirtyDaysAgo}`);
    console.log("Success with sql");
  } catch (err) {
    console.error("Error with sql:", err);
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log("Testing with lt:", thirtyDaysAgo);
    await db.delete(audit_logs).where(lt(audit_logs.timestamp, thirtyDaysAgo));
    console.log("Success with lt");
  } catch (err) {
    console.error("Error with lt:", err);
  }

  try {
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 86400000).toISOString();
    console.log("Testing with ISO string sql:", thirtyDaysAgoIso);
    await db.delete(audit_logs).where(sql`${audit_logs.timestamp} < ${thirtyDaysAgoIso}`);
    console.log("Success with ISO string sql");
  } catch (err) {
    console.error("Error with ISO string sql:", err);
  }
  process.exit(0);
}

run();
