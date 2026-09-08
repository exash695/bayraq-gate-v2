import { sql } from './index';

async function alterTable() {
  try {
    await sql`ALTER TABLE "school_configs" ADD COLUMN IF NOT EXISTS "tuition_fees_by_grade" jsonb DEFAULT '{}'::jsonb`;
    console.log("Added tuition_fees_by_grade");
    await sql`ALTER TABLE "school_configs" ADD COLUMN IF NOT EXISTS "active_finance_stage" varchar(100)`;
    console.log("Added active_finance_stage");
    await sql`ALTER TABLE "school_configs" ADD COLUMN IF NOT EXISTS "finance_pin" varchar(20)`;
    console.log("Added finance_pin");
    await sql`ALTER TABLE "school_configs" ADD COLUMN IF NOT EXISTS "payment_methods" jsonb DEFAULT '{}'::jsonb`;
    console.log("Added payment_methods");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

alterTable();
