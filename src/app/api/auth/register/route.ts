import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';

interface InviteCodeRow extends RowDataPacket {
  worker_name: string;
  worker_phone: string;
  organization: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userName   = String(body.user_name ?? '사용자').trim().slice(0, 30);
    const lang       = ['ko', 'ja'].includes(body.lang) ? body.lang : 'ko';
    const inviteCode = String(body.invite_code ?? '').trim().toUpperCase();
    const token      = randomUUID();

    let careWorker = null;
    if (inviteCode) {
      const result = await query<InviteCodeRow>(
        `SELECT worker_name, worker_phone, organization
         FROM invite_codes
         WHERE code = ? AND used = 0`,
        [inviteCode]
      );
      if (result.rows.length > 0) {
        const cw = result.rows[0];
        careWorker = {
          name:         cw.worker_name,
          phone:        cw.worker_phone,
          organization: cw.organization,
        };
        await execute(
          'UPDATE invite_codes SET used = 1, used_at = NOW(3) WHERE code = ?',
          [inviteCode]
        );
      }
    }

    await execute(
      'INSERT INTO users (token, user_name, lang) VALUES (?, ?, ?)',
      [token, userName, lang]
    );

    return NextResponse.json({ token, care_worker: careWorker }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
