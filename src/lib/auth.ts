import { query } from './db';
import { NextRequest } from 'next/server';
import { RowDataPacket } from 'mysql2';

export interface DbUser extends RowDataPacket {
  user_id: number;
  name: string;
  interval_hours: number;
  last_checkin_at: string | null;
  alert_sent_at: string | null;
  status: 'danger' | 'warning' | 'safe';
}

export async function getUserFromRequest(req: NextRequest): Promise<DbUser | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const result = await query<DbUser>(
    `SELECT user_id, name, interval_hours, last_checkin_at, alert_sent_at, status
     FROM users WHERE token = ?`,
    [token]
  );
  return result.rows[0] ?? null;
}
