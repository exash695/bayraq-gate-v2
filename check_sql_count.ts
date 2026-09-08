
import { db } from './src/db';
import { activation_codes } from './src/db/schema';
import { count } from 'drizzle-orm';

async function checkCount() {
  const result = await db.select({ value: count() }).from(activation_codes);
  console.log(`SQL Activation Codes: ${result[0].value}`);
  process.exit(0);
}

checkCount().catch(err => {
  console.error(err);
  process.exit(1);
});
