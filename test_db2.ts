import { db } from './src/db';
import { lounge_messages } from './src/db/schema';
import crypto from 'crypto';

(async () => {
  try {
    const uuidv4 = crypto.randomUUID.bind(crypto);
    const newMsg = {
        id: uuidv4(),
        text: "Hello test 2",
        userId: "user_a",
        userName: "Test User A",
        userRole: "student",
        schoolId: "user_a_user_b",
        recipientId: "user_b",
        read: false,
        timestamp: new Date()
    };
    await db.insert(lounge_messages).values(newMsg);
    console.log("Success");
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
})();
