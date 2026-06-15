import { query } from './db';
import { NextRequest } from 'next/server';
import { RowDataPacket } from 'mysql2';

export interface DbUser extends RowDataPacket {
  id: number;
  user_name: string;
  contact_name: string | null;
  contact_email: string | null;
  interval_hours: number;
  last_checkin_at: string | null;
  alert_sent_at: string | null;
}

export async function getUserFromRequest(req: NextRequest): Promise<DbUser | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const result = await query<DbUser>(
    `SELECT id, user_name, contact_name, contact_email,
            interval_hours, last_checkin_at, alert_sent_at
     FROM users WHERE token = ?`,
    [token]
  );
  return result.rows[0] ?? null;
}
