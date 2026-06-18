import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }

    if (!user.last_checkin_at) {
      return NextResponse.json({
        status:         'unknown',
        user_name:      user.name,
        interval_hours: user.interval_hours,
        alert_sent:     false,
        care_worker:    null,
      });
    }

    const lastCheckin    = new Date(user.last_checkin_at);
    const deadline       = new Date(lastCheckin.getTime() + user.interval_hours * 3_600_000);
    const now            = new Date();
    const remainingMs    = deadline.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingMs / 3_600_000);

    let status: 'safe' | 'warning' | 'overdue';
    if (remainingMs < 0)         status = 'overdue';
    else if (remainingHours < 8) status = 'warning';
    else                         status = 'safe';

    return NextResponse.json({
      status,
      user_name:       user.name,
      last_checkin_at: user.last_checkin_at,
      deadline_at:     deadline.toISOString(),
      remaining_hours: remainingHours,
      alert_sent:      !!user.alert_sent_at,
      interval_hours:  user.interval_hours,
      care_worker:     null,
    });
  } catch (err) {
    console.error('[GET /api/checkin/status]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
