import type { Sql } from 'postgres';

export interface DbEventPayload {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  id: string;
  school_id?: string | null;
  recipient_id?: string | null;
  user_id?: string | null;
  student_id?: string | null;
  timestamp: number;
}

const REALTIME_TABLES = [
  'lounge_messages',
  'notifications',
  'broadcasts',
  'school_announcements',
  'student_transactions',
  'payment_requests',
  'attendance_logs',
  'behavior_logs',
  'class_schedules',
  'academic_lists',
  'students',
  'teachers',
  'schools',
  'support_tickets',
  'idea_bank',
  'council_polls',
  'transport_routes',
  'transport_drivers',
  'transport_students_status',
  'transport_fees',
  'salaries',
  'community_posts',
  'community_comments',
  'community_stories',
  'recorded_lessons',
  'school_files',
  'academy_pages',
  'video_comments',
  'student_live_notes',
  'exam_papers',
  'question_bank',
  'firestore_docs',
];

export async function initDatabaseTriggers(sql: Sql): Promise<void> {
  try {
    // 1. Create or replace the universal lightweight notify function
    await sql`
      CREATE OR REPLACE FUNCTION notify_db_event() RETURNS trigger AS $$
      DECLARE
        v_school_id TEXT := NULL;
        v_entity_id TEXT := NULL;
        v_recipient_id TEXT := NULL;
        v_user_id TEXT := NULL;
        v_student_id TEXT := NULL;
        v_payload JSONB;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          BEGIN v_entity_id := OLD.id::text; EXCEPTION WHEN OTHERS THEN 
            BEGIN v_entity_id := OLD.path::text; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
          END;
          BEGIN v_school_id := OLD.school_id::text; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
        ELSE
          BEGIN v_entity_id := NEW.id::text; EXCEPTION WHEN OTHERS THEN 
            BEGIN v_entity_id := NEW.path::text; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
          END;
          BEGIN v_school_id := NEW.school_id::text; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
          BEGIN v_recipient_id := NEW.recipient_id::text; EXCEPTION WHEN OTHERS THEN v_recipient_id := NULL; END;
          BEGIN v_user_id := NEW.user_id::text; EXCEPTION WHEN OTHERS THEN v_user_id := NULL; END;
          BEGIN v_student_id := NEW.student_id::text; EXCEPTION WHEN OTHERS THEN v_student_id := NULL; END;
        END IF;

        v_payload := json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'id', v_entity_id,
          'school_id', v_school_id,
          'recipient_id', v_recipient_id,
          'user_id', v_user_id,
          'student_id', v_student_id,
          'timestamp', (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
        );

        PERFORM pg_notify('bairaq_realtime_events', v_payload::text);
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;

    // 2. Attach triggers to tables
    for (const table of REALTIME_TABLES) {
      try {
        await sql.unsafe(`
          DROP TRIGGER IF EXISTS trg_${table}_notify ON ${table};
          CREATE TRIGGER trg_${table}_notify
          AFTER INSERT OR UPDATE OR DELETE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION notify_db_event();
        `);
      } catch (err: any) {
        console.warn(`[Realtime DB] Skipped trigger for ${table}:`, err.message);
      }
    }

    console.log('[Realtime DB] PostgreSQL triggers initialized successfully.');
  } catch (err) {
    console.error('[Realtime DB] Error initializing PostgreSQL triggers:', err);
  }
}

export async function startPgListener(sql: Sql, onEvent: (event: DbEventPayload) => void): Promise<() => Promise<void>> {
  try {
    const sub = await sql.listen('bairaq_realtime_events', (payloadStr) => {
      try {
        const payload = JSON.parse(payloadStr) as DbEventPayload;
        onEvent(payload);
      } catch (e) {
        console.error('[Realtime DB] Error parsing NOTIFY payload:', e);
      }
    });

    console.log('[Realtime DB] PostgreSQL LISTEN subscribed to "bairaq_realtime_events".');

    return async () => {
      try {
        await sub.unlisten();
      } catch (e) {
        console.error('[Realtime DB] Error unlistening:', e);
      }
    };
  } catch (err) {
    console.error('[Realtime DB] Failed to start PostgreSQL LISTEN:', err);
    return async () => {};
  }
}
