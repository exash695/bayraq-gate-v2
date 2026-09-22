import { db } from './src/db';
import { sql } from 'drizzle-orm';
import { users, students, teachers, activation_codes } from './src/db/schema';
import { isNull } from 'drizzle-orm';

async function check() {
  const orphanUsers = await db.select().from(users).where(isNull(users.schoolId));
  const orphanStudents = await db.select().from(students).where(isNull(students.schoolId));
  const orphanTeachers = await db.select().from(teachers).where(isNull(teachers.schoolId));
  const orphanCodes = await db.select().from(activation_codes).where(isNull(activation_codes.schoolId));

  console.log("Orphan Users:", orphanUsers.length);
  console.log("Orphan Students:", orphanStudents.length);
  console.log("Orphan Teachers:", orphanTeachers.length);
  console.log("Orphan Codes:", orphanCodes.length);
}
check().then(() => process.exit(0)).catch(console.error);
