import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const intervalHours = Number(body.interval_hours);

    if (!Number.isInteger(intervalHours) || intervalHours < 1 || intervalHours > 168) {
      return NextResponse.json(
        { error: 'interval_hours는 1~168 사이의 정수여야 합니다.' },
        { status: 400 }
      );
    }

    await execute(
      'UPDATE users SET interval_hours = ?, updated_at = NOW(3) WHERE user_id = ?',
      [intervalHours, user.user_id]
    );

    return NextResponse.json({ interval_hours: intervalHours });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
