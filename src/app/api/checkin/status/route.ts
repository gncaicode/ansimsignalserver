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

    // mysql2는 타임존 없이 DATETIME을 반환하므로 KST(+09:00)로 명시 파싱
    const raw = user.last_checkin_at;
    const lastCheckinIso = (raw.includes('T') ? raw : raw.replace(' ', 'T')) + '+09:00';
    const lastCheckin = new Date(lastCheckinIso);
    const deadline       = new Date(lastCheckin.getTime() + user.interval_hours * 3_600_000);
    const now            = new Date();
    const remainingMs          = deadline.getTime() - now.getTime();
    const remainingHours       = remainingMs / 3_600_000;
    const dangerThresholdHours  = user.interval_hours / 12;
    const warningThresholdHours = user.interval_hours / 3;

    let status: 'safe' | 'warning' | 'overdue';
    if (remainingHours < dangerThresholdHours)       status = 'overdue';
    else if (remainingHours < warningThresholdHours) status = 'warning';
    else                                             status = 'safe';

    return NextResponse.json({
      status,
      user_name:       user.name,
      last_checkin_at: lastCheckinIso,
      deadline_at:     deadline.toISOString(),
      remaining_hours: Math.max(0, remainingHours),
      alert_sent:      !!user.alert_sent_at,
      interval_hours:  user.interval_hours,
      care_worker:     null,
    });
  } catch (err) {
    console.error('[GET /api/checkin/status]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
