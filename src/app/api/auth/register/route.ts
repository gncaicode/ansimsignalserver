import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';

interface InviteCodeRow extends RowDataPacket {
  code_id: number;
  admin_id: number | null;
  admin_name: string | null;
  admin_phone: string | null;
  org_name: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userName   = String(body.user_name ?? '사용자').trim().slice(0, 30);
    const lang       = ['ko', 'ja'].includes(body.lang) ? body.lang : 'ko';
    const inviteCode = String(body.invite_code ?? '').trim().toUpperCase();
    const token      = randomUUID();

    let careWorker = null;
    let adminId: number | null = null;

    if (inviteCode) {
      const result = await query<InviteCodeRow>(
        `SELECT ic.code_id, ic.admin_id,
                a.name AS admin_name, a.phone AS admin_phone,
                o.name AS org_name
         FROM invite_codes ic
         LEFT JOIN admins a ON ic.admin_id = a.admin_id
         LEFT JOIN organizations o ON a.organization_id = o.org_id
         WHERE ic.code = ? AND ic.used = 0`,
        [inviteCode]
      );
      if (result.rows.length > 0) {
        const cw = result.rows[0];
        adminId = cw.admin_id;
        careWorker = {
          name:         cw.admin_name,
          phone:        cw.admin_phone,
          organization: cw.org_name,
        };
        await execute(
          'UPDATE invite_codes SET used = 1, used_at = NOW(3), user_id = LAST_INSERT_ID() WHERE code = ?',
          [inviteCode]
        );
      }
    }

    await execute(
      'INSERT INTO users (name, lang, token, admin_id, joined_at, register_flag) VALUES (?, ?, ?, ?, CURDATE(), 1)',
      [userName, lang, token, adminId]
    );

    return NextResponse.json({ token, care_worker: careWorker }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
