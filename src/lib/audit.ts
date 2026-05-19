import { query } from './db';

interface AuditInput {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent(input: AuditInput) {
  try {
    await query(
      `
        insert into audit_log (
          actor_user_id, actor_email, action, entity_type, entity_id, metadata
        )
        values ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        input.actorUserId ?? null,
        input.actorEmail ?? null,
        input.action,
        input.entityType ?? null,
        input.entityId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    );
  } catch (error) {
    console.error('Audit log write failed.', error);
  }
}

export async function getRecentAuditEvents(limit = 10) {
  try {
    const result = await query<{
      id: string;
      actor_email: string | null;
      action: string;
      entity_type: string | null;
      created_at: Date;
    }>(
      `
        select id, actor_email, action, entity_type, created_at
        from audit_log
        order by created_at desc
        limit $1
      `,
      [limit],
    );

    return result.rows;
  } catch (error) {
    console.error('Audit log read failed.', error);
    return [];
  }
}
