import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }

    await execute(
      `UPDATE users
       SET last_checkin_at = NOW(3),
           alert_sent_at   = NULL,
           status          = 'safe',
           updated_at      = NOW(3)
       WHERE user_id = ?`,
      [user.user_id]
    );

    return NextResponse.json({
      message:    '체크인이 완료되었습니다.',
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/checkin]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
