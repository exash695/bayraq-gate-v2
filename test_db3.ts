import { db } from './src/db';
import { lounge_messages } from './src/db/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    const msgs = await db.select().from(lounge_messages).where(eq(lounge_messages.text, "Hello test 2"));
    console.log(msgs);
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
})();
