import { query } from "./db";
import type { RowDataPacket } from "mysql2";

const NOW_KST = "NOW()";

function monthRange(year: number, month: number): { monthStart: string; monthEnd: string } {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01 00:00:00`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01 00:00:00`;
  return { monthStart, monthEnd };
}

// district filter helper — same logic as dashboard-data.ts
function districtFilter(districtIds: number[] | null | undefined, orgId: number | null) {
  if (districtIds != null) {
    if (districtIds.length === 0) return { cond: "AND 1=0", params: [] as (number | string | null)[] };
    const ph = districtIds.map(() => "?").join(",");
    return { cond: `AND u.district_id IN (${ph})`, params: districtIds as (number | string | null)[] };
  }
  if (orgId) return { cond: "AND d.org_id = ?", params: [orgId] as (number | string | null)[] };
  return { cond: "", params: [] as (number | string | null)[] };
}

export interface MonthlyReport {
  overview: {
    orgName: string;
    year: number;
    month: number;
    generatedAt: string;
  };
  subjects: {
    total: number;
    pending: number;
    danger: number;
    warn: number;
    safe: number;
    newJoined: number;
  };
  checkin: {
    checkedInMonth: number;
    total: number;
    rate: number;
  };
  alerts: {
    sent: number;
  };
  districts: {
    name: string;
    total: number;
    danger: number;
    warn: number;
    workerCount: number;
    checkinRate: number;
  }[];
  actions: {
    visit: number;
    call: number;
    sms: number;
    hospital: number;
    other: number;
    total: number;
  };
}

interface OrgRow extends RowDataPacket { name: string; }
interface StatsRow extends RowDataPacket {
  total: number;
  pending: number;
  danger: number;
  warn: number;
  safe: number;
}
interface NewJoinedRow extends RowDataPacket { cnt: number; }
interface CheckinRow extends RowDataPacket { checked_in: number; total: number; }
interface AlertRow extends RowDataPacket { sent: number; }
interface DistrictRow extends RowDataPacket {
  name: string;
  total: number;
  danger: number;
  warn: number;
  worker_count: number;
  checked_in: number;
}
interface ActionRow extends RowDataPacket {
  action_type: string;
  cnt: number;
}

export async function getMonthlyReport(
  orgId: number | null,
  year: number,
  month: number,
  districtIds: number[] | null,
): Promise<MonthlyReport> {
  const { monthStart, monthEnd } = monthRange(year, month);
  const f = districtFilter(districtIds, orgId);

  // Need LEFT JOIN districts for org filter when districtIds is null
  const filterJoin =
    districtIds != null
      ? ""
      : orgId
      ? "LEFT JOIN districts d ON u.district_id = d.dist_id"
      : "";

  // 1. Org name
  let orgName = "";
  if (orgId) {
    const { rows } = await query<OrgRow>(
      "SELECT name FROM organizations WHERE org_id = ? LIMIT 1",
      [orgId],
    );
    orgName = rows[0]?.name ?? "";
  }

  // 2. Current subject stats (real-time danger/warn/safe)
  const { rows: statsRows } = await query<StatsRow>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN u.register_flag = 0 THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN u.register_flag = 1 AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
       SUM(CASE WHEN u.register_flag = 1 AND u.last_checkin_at IS NOT NULL
                    AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                    AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
               THEN 1 ELSE 0 END) AS warn,
       SUM(CASE WHEN u.register_flag = 1 AND (u.last_checkin_at IS NULL
                    OR (${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                        AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 >= u.interval_hours / 12.0))
               THEN 1 ELSE 0 END) AS safe
     FROM users u
     ${filterJoin}
     WHERE u.active_flag = 1 ${f.cond}`,
    f.params,
  );
  const statsRow = statsRows[0];
  const total   = Number(statsRow?.total   ?? 0);
  const pending = Number(statsRow?.pending ?? 0);
  const danger  = Number(statsRow?.danger  ?? 0);
  const warn    = Number(statsRow?.warn    ?? 0);
  const safe    = Number(statsRow?.safe    ?? 0);

  // 3. New subjects joined this month
  const { rows: newJoinedRows } = await query<NewJoinedRow>(
    `SELECT COUNT(*) AS cnt
     FROM users u
     ${filterJoin}
     WHERE u.active_flag = 1
       AND u.joined_at >= ? AND u.joined_at < ?
       ${f.cond}`,
    [monthStart, monthEnd, ...f.params],
  );
  const newJoined = Number(newJoinedRows[0]?.cnt ?? 0);

  // 4. Check-in rate for this month
  // checkedInMonth = subjects who have last_checkin_at within the month
  const { rows: checkinRows } = await query<CheckinRow>(
    `SELECT
       SUM(CASE WHEN u.last_checkin_at >= ? AND u.last_checkin_at < ? THEN 1 ELSE 0 END) AS checked_in,
       COUNT(*) AS total
     FROM users u
     ${filterJoin}
     WHERE u.active_flag = 1 AND u.register_flag = 1 ${f.cond}`,
    [monthStart, monthEnd, ...f.params],
  );
  const checkedInMonth = Number(checkinRows[0]?.checked_in ?? 0);
  const checkinTotal   = Number(checkinRows[0]?.total      ?? 0);
  const checkinRate    = checkinTotal > 0 ? Math.round((checkedInMonth / checkinTotal) * 100) : 0;

  // 5. Alerts sent this month (alert_sent_at within the month)
  const { rows: alertRows } = await query<AlertRow>(
    `SELECT COUNT(*) AS sent
     FROM users u
     ${filterJoin}
     WHERE u.active_flag = 1
       AND u.alert_sent_at >= ? AND u.alert_sent_at < ?
       ${f.cond}`,
    [monthStart, monthEnd, ...f.params],
  );
  const alertsSent = Number(alertRows[0]?.sent ?? 0);

  // 6. Per-district breakdown
  // Worker count = number of social_workers assigned to that district
  let districtSql: string;
  let districtParams: (string | number | null)[];

  if (districtIds != null) {
    if (districtIds.length === 0) {
      // no districts — return empty
      districtSql = "SELECT 1 LIMIT 0";
      districtParams = [];
    } else {
      const ph = districtIds.map(() => "?").join(",");
      districtSql = `
        SELECT
          d.name,
          COUNT(DISTINCT u.user_id) AS total,
          SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
          SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                       AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                       AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
                  THEN 1 ELSE 0 END) AS warn,
          COUNT(DISTINCT CASE WHEN a.role = 'social_worker' AND a.active_flag = 1 AND a.withdraw_flag = 0 THEN a.admin_id END) AS worker_count,
          SUM(CASE WHEN u.last_checkin_at >= ? AND u.last_checkin_at < ? THEN 1 ELSE 0 END) AS checked_in
        FROM districts d
        LEFT JOIN users u ON u.district_id = d.dist_id AND u.active_flag = 1
        LEFT JOIN admin_districts ad ON ad.district_id = d.dist_id
        LEFT JOIN admins a ON a.admin_id = ad.admin_id
        WHERE d.dist_id IN (${ph})
        GROUP BY d.dist_id, d.name
        ORDER BY total DESC`;
      districtParams = [monthStart, monthEnd, ...districtIds];
    }
  } else if (orgId) {
    districtSql = `
      SELECT
        d.name,
        COUNT(DISTINCT u.user_id) AS total,
        SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
        SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                     AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                     AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
                THEN 1 ELSE 0 END) AS warn,
        COUNT(DISTINCT CASE WHEN a.role = 'social_worker' AND a.active_flag = 1 AND a.withdraw_flag = 0 THEN a.admin_id END) AS worker_count,
        SUM(CASE WHEN u.last_checkin_at >= ? AND u.last_checkin_at < ? THEN 1 ELSE 0 END) AS checked_in
      FROM districts d
      LEFT JOIN users u ON u.district_id = d.dist_id AND u.active_flag = 1
      LEFT JOIN admin_districts ad ON ad.district_id = d.dist_id
      LEFT JOIN admins a ON a.admin_id = ad.admin_id
      WHERE d.org_id = ?
      GROUP BY d.dist_id, d.name
      ORDER BY total DESC`;
    districtParams = [monthStart, monthEnd, orgId];
  } else {
    districtSql = "SELECT 1 LIMIT 0";
    districtParams = [];
  }

  const { rows: districtRows } =
    districtSql === "SELECT 1 LIMIT 0"
      ? { rows: [] as DistrictRow[] }
      : await query<DistrictRow>(districtSql, districtParams);

  const districts = districtRows.map((r) => {
    const dTotal      = Number(r.total);
    const dDanger     = Number(r.danger);
    const dWarn       = Number(r.warn);
    const dCheckedIn  = Number(r.checked_in);
    const dRate       = dTotal > 0 ? Math.round((dCheckedIn / dTotal) * 100) : 0;
    return {
      name:         r.name,
      total:        dTotal,
      danger:       dDanger,
      warn:         dWarn,
      workerCount:  Number(r.worker_count),
      checkinRate:  dRate,
    };
  });

  // 7. Action log counts by type for this month
  // Join users to apply district/org filter
  let actionSql: string;
  let actionParams: (string | number | null)[];

  if (districtIds != null) {
    if (districtIds.length === 0) {
      actionSql = "SELECT 1 LIMIT 0";
      actionParams = [];
    } else {
      const ph = districtIds.map(() => "?").join(",");
      actionSql = `
        SELECT l.action_type, COUNT(*) AS cnt
        FROM action_logs l
        JOIN users u ON l.user_id = u.user_id
        WHERE l.created_at >= ? AND l.created_at < ?
          AND u.district_id IN (${ph})
        GROUP BY l.action_type`;
      actionParams = [monthStart, monthEnd, ...districtIds];
    }
  } else if (orgId) {
    actionSql = `
      SELECT l.action_type, COUNT(*) AS cnt
      FROM action_logs l
      JOIN users u ON l.user_id = u.user_id
      JOIN districts d ON u.district_id = d.dist_id
      WHERE l.created_at >= ? AND l.created_at < ?
        AND d.org_id = ?
      GROUP BY l.action_type`;
    actionParams = [monthStart, monthEnd, orgId];
  } else {
    actionSql = "SELECT 1 LIMIT 0";
    actionParams = [];
  }

  const { rows: actionRows } =
    actionSql === "SELECT 1 LIMIT 0"
      ? { rows: [] as ActionRow[] }
      : await query<ActionRow>(actionSql, actionParams);

  const actionMap: Record<string, number> = {};
  for (const r of actionRows) {
    actionMap[r.action_type] = Number(r.cnt);
  }
  const visit    = actionMap["visit"]    ?? 0;
  const call     = actionMap["call"]     ?? 0;
  const sms      = actionMap["sms"]      ?? 0;
  const hospital = actionMap["hospital"] ?? 0;
  const other    = actionMap["other"]    ?? 0;

  // 8. Generated at (KST string from server)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const generatedAt = kstNow.toISOString().replace("T", " ").substring(0, 16) + " (KST)";

  return {
    overview: { orgName, year, month, generatedAt },
    subjects: { total, pending, danger, warn, safe, newJoined },
    checkin:  { checkedInMonth, total: checkinTotal, rate: checkinRate },
    alerts:   { sent: alertsSent },
    districts,
    actions: {
      visit,
      call,
      sms,
      hospital,
      other,
      total: visit + call + sms + hospital + other,
    },
  };
}
