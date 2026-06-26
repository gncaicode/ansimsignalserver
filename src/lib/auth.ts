import { query } from './db';
import { NextRequest } from 'next/server';
import { RowDataPacket } from 'mysql2';

export interface DbUser extends RowDataPacket {
  user_id: number;
  name: string;
  interval_hours: number;
  last_checkin_at: string | null;
  alert_sent_at: string | null;
  status: 'danger' | 'warn' | 'safe';
}

export interface DbUserWithCareWorkers extends DbUser {
  care_workers_raw: string | null;
}

export interface CareWorker {
  name: string;
  phone: string;
}

export function parseCareWorkers(raw: string | null): CareWorker[] {
  if (!raw) return [];
  return raw.split('\t').map((entry) => {
    const [name, phone] = entry.split('|');
    return { name: name ?? '', phone: phone ?? '' };
  });
}

function extractToken(req: NextRequest): string {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export async function getUserFromRequest(req: NextRequest): Promise<DbUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  const result = await query<DbUser>(
    `SELECT user_id, name, interval_hours, last_checkin_at, alert_sent_at, status
     FROM users WHERE token = ?`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function getUserWithCareWorkers(req: NextRequest): Promise<DbUserWithCareWorkers | null> {
  const token = extractToken(req);
  if (!token) return null;

  const result = await query<DbUserWithCareWorkers>(
    `SELECT u.user_id, u.name, u.interval_hours, u.last_checkin_at, u.alert_sent_at, u.status,
            GROUP_CONCAT(CONCAT(a.name, '|', COALESCE(a.phone, '')) ORDER BY a.name SEPARATOR '\t') AS care_workers_raw
     FROM users u
     LEFT JOIN admin_districts ad ON u.district_id = ad.district_id
     LEFT JOIN admins a ON ad.admin_id = a.admin_id
                       AND a.role = 'social_worker'
                       AND a.active_flag = 1
                       AND a.withdraw_flag = 0
     WHERE u.token = ?
     GROUP BY u.user_id`,
    [token]
  );
  return result.rows[0] ?? null;
}
