import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mailer';
import { RowDataPacket } from 'mysql2';

interface OverdueUser extends RowDataPacket {
  user_id: number;
  name: string;
  admin_email: string | null;
  interval_hours: number;
  last_checkin_at: string;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  try {
    const { rows } = await query<OverdueUser>(
      `SELECT u.user_id, u.name, a.email AS admin_email,
              u.interval_hours, u.last_checkin_at
       FROM users u
       LEFT JOIN admins a ON u.admin_id = a.admin_id
       WHERE u.last_checkin_at IS NOT NULL
         AND DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) < NOW()
         AND u.alert_sent_at IS NULL`
    );

    let alerted = 0;

    for (const user of rows) {
      const lastCheckin  = new Date(user.last_checkin_at);
      const hoursOverdue = Math.floor((Date.now() - lastCheckin.getTime()) / 3_600_000) - user.interval_hours;

      if (user.admin_email) {
        try {
          await sendAlertEmail(user.admin_email, user.name, hoursOverdue);
          alerted++;
        } catch (mailErr) {
          console.error(`[cron/alert] 메일 발송 실패 (user ${user.user_id}):`, mailErr);
        }
      }

      await execute(
        'UPDATE users SET alert_sent_at = NOW(3), status = ? WHERE user_id = ?',
        [hoursOverdue > 0 ? 'danger' : 'warning', user.user_id]
      );
    }

    console.log(`[cron/alert] processed=${rows.length}, alerted=${alerted}`);
    return NextResponse.json({ processed: rows.length, alerted });
  } catch (err) {
    console.error('[GET /api/cron/alert]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
