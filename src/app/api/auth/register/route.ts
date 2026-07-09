import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { logStatusChange } from '@/lib/status-log';
import { RowDataPacket } from 'mysql2';

interface InviteCodeRow extends RowDataPacket {
  code_id: number;
  user_id: number;
  admin_id: number | null;
  admin_name: string | null;
  admin_phone: string | null;
  org_name: string | null;
  user_name: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const lang       = ['ko', 'ja'].includes(body.lang) ? body.lang : 'ko';
    const inviteCode = String(body.invite_code ?? '').trim().toUpperCase();

    if (!inviteCode) {
      return NextResponse.json({ error: '초대코드를 입력해주세요.' }, { status: 400 });
    }

    // 초대코드로 대상자 조회
    const { rows } = await query<InviteCodeRow>(
      `SELECT ic.code_id, ic.user_id, ic.admin_id,
              u.name AS user_name,
              a.name AS admin_name, a.phone AS admin_phone,
              o.name AS org_name
       FROM invite_codes ic
       LEFT JOIN users u ON ic.user_id = u.user_id
       LEFT JOIN admins a ON ic.admin_id = a.admin_id
       LEFT JOIN organizations o ON a.organization_id = o.org_id
       WHERE ic.code = ? AND ic.used = 0`,
      [inviteCode]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: '유효하지 않은 초대코드입니다.' }, { status: 400 });
    }

    const invite = rows[0];
    const { randomUUID } = await import('crypto');
    const token = randomUUID();

    // 기존 대상자 row에 token 등록 (새 row 생성 안 함)
    const { affectedRows } = await execute(
      `UPDATE users
       SET token = ?, lang = ?, register_flag = 1, updated_at = NOW()
       WHERE user_id = ? AND register_flag = 0`,
      [token, lang, invite.user_id]
    );
    if (affectedRows > 0) {
      await logStatusChange(invite.user_id, 'safe');
    }

    // 코드 사용 처리
    await execute(
      'UPDATE invite_codes SET used = 1, used_at = NOW(3) WHERE code_id = ?',
      [invite.code_id]
    );

    const careWorkers = invite.admin_name
      ? [{ name: invite.admin_name, phone: invite.admin_phone ?? null }]
      : [];

    return NextResponse.json({
      token,
      user: {
        name: invite.user_name,
      },
      care_workers: careWorkers,
    }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
