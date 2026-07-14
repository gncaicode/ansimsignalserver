import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { nowKst } from '@/lib/utils';

// 대상자가 앱 설정(체크인 방식/주기)이 서버와 정상 연결됐는지 확인하는 신호.
// 실제 체크인(last_checkin_at)에는 절대 영향을 주지 않는다.
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }

    const kst = nowKst();
    await execute(
      `UPDATE users SET last_test_connection_at = ? WHERE user_id = ?`,
      [kst, user.user_id]
    );

    return NextResponse.json({
      message:     '설정 확인 신호가 수신되었습니다.',
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/checkin/test-connection]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
