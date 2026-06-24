import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { nowKst } from '@/lib/utils';
import { checkinEmitter } from '@/lib/checkin-events';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }

    const kst = nowKst();
    await execute(
      `UPDATE users
       SET last_checkin_at = ?,
           alert_sent_at   = NULL,
           status          = 'safe',
           updated_at      = ?
       WHERE user_id = ?`,
      [kst, kst, user.user_id]
    );

    // 연결 중인 대시보드에 실시간 갱신 신호 발송
    checkinEmitter.emit('checkin');

    return NextResponse.json({
      message:    '체크인이 완료되었습니다.',
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/checkin]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
