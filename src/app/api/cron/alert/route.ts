import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mailer';
import { RowDataPacket } from 'mysql2';

interface OverdueUser extends RowDataPacket {
  id: number;
  user_name: string;
  contact_email: string | null;
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
      `SELECT id, user_name, contact_email, interval_hours, last_checkin_at
       FROM users
       WHERE last_checkin_at IS NOT NULL
         AND DATE_ADD(last_checkin_at, INTERVAL interval_hours HOUR) < NOW()
         AND alert_sent_at IS NULL`
    );

    let alerted = 0;

    for (const user of rows) {
      const lastCheckin = new Date(user.last_checkin_at);
      const hoursOverdue = Math.floor((Date.now() - lastCheckin.getTime()) / 3_600_000) - user.interval_hours;

      if (user.contact_email) {
        try {
          await sendAlertEmail(user.contact_email, user.user_name, hoursOverdue);
          alerted++;
        } catch (mailErr) {
          console.error(`[cron/alert] 메일 발송 실패 (user ${user.id}):`, mailErr);
        }
      }

      await execute(
        'UPDATE users SET alert_sent_at = NOW(3) WHERE id = ?',
        [user.id]
      );
    }

    console.log(`[cron/alert] processed=${rows.length}, alerted=${alerted}`);
    return NextResponse.json({ processed: rows.length, alerted });
  } catch (err) {
    console.error('[GET /api/cron/alert]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
