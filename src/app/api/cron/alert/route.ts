import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mailer';
import { nowKst } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

interface OverdueUser extends RowDataPacket {
  user_id: number;
  name: string;
  admin_emails: string | null;  // 구역 담당 복지사 이메일 (콤마 구분)
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
      `SELECT u.user_id, u.name,
              u.interval_hours, u.last_checkin_at,
              GROUP_CONCAT(DISTINCT a.email ORDER BY a.name SEPARATOR ',') AS admin_emails
       FROM users u
       LEFT JOIN admin_districts ad ON u.district_id = ad.district_id
       LEFT JOIN admins a ON ad.admin_id = a.admin_id
                         AND a.role = 'social_worker'
                         AND a.active_flag = 1
                         AND a.withdraw_flag = 0
                         AND a.email IS NOT NULL
       WHERE u.active_flag = 1
         AND u.register_flag = 1
         AND u.last_checkin_at IS NOT NULL
         AND DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) < NOW()
         AND u.alert_sent_at IS NULL
       GROUP BY u.user_id, u.name, u.interval_hours, u.last_checkin_at`
    );

    let alerted = 0;

    for (const user of rows) {
      const lastCheckin  = new Date(user.last_checkin_at.replace(' ', 'T') + '+09:00');
      const hoursOverdue = Math.floor((Date.now() - lastCheckin.getTime()) / 3_600_000) - user.interval_hours;

      if (user.admin_emails) {
        try {
          await sendAlertEmail(user.admin_emails, user.name, hoursOverdue);
          alerted++;
        } catch (mailErr) {
          console.error(`[cron/alert] 메일 발송 실패 (user ${user.user_id}):`, mailErr);
        }
      }

      await execute(
        'UPDATE users SET alert_sent_at = ?, status = ? WHERE user_id = ?',
        [nowKst(), hoursOverdue > 0 ? 'danger' : 'warn', user.user_id]
      );
    }

    console.log(`[cron/alert] processed=${rows.length}, alerted=${alerted}`);
    return NextResponse.json({ processed: rows.length, alerted });
  } catch (err) {
    console.error('[GET /api/cron/alert]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
