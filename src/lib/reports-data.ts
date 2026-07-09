import { query } from "./db";
import { nowKst } from "./utils";
import type { RowDataPacket } from "mysql2";

const NOW_KST = "NOW()";

// 대상자별 user_status_logs에서 특정 시각(changed_at < ?) 이전의 마지막 이력 1건을 뽑는 서브쿼리
// (지난 달처럼 이미 끝난 기간의 "그 시점 기준 상태"를 재구성할 때 사용)
const LATEST_STATUS_JOIN = `
  LEFT JOIN (
    SELECT user_id, status,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY changed_at DESC, log_id DESC) AS rn
    FROM user_status_logs
    WHERE changed_at < ?
  ) latest ON latest.user_id = u.user_id AND latest.rn = 1`;

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
interface AlertRow extends RowDataPacket { sent: number; }
interface DistrictRow extends RowDataPacket {
  name: string;
  total: number;
  pending: number;
  danger: number;
  warn: number;
  worker_count: number;
}
interface ActionRow extends RowDataPacket {
  action_type: string;
  cnt: number;
}
interface StatusCountRow extends RowDataPacket { status: string; cnt: number; }

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

  // 이미 끝난(과거) 달인지 — 과거 달은 실시간(NOW()) 계산이 아니라 user_status_logs 기반
  // "그 달 말 시점 기준" 상태로 재구성한다. 진행 중인(이번) 달은 지금처럼 실시간 계산 유지.
  const isPastMonth = monthEnd <= nowKst();

  // 1. Org name
  let orgName = "";
  if (orgId) {
    const { rows } = await query<OrgRow>(
      "SELECT name FROM organizations WHERE org_id = ? LIMIT 1",
      [orgId],
    );
    orgName = rows[0]?.name ?? "";
  }

  // 2. Subject stats — 이번 달(진행 중): 실시간 계산 / 지난 달(종료): 이력 기반 재구성
  let total = 0, pending = 0, danger = 0, warn = 0, safe = 0;

  if (isPastMonth) {
    const { rows: histRows } = await query<StatusCountRow>(
      `SELECT latest.status AS status, COUNT(*) AS cnt
       FROM users u
       ${filterJoin}
       ${LATEST_STATUS_JOIN}
       WHERE u.active_flag = 1 AND u.joined_at < ? ${f.cond}
       GROUP BY latest.status`,
      [monthEnd, monthEnd, ...f.params],
    );
    for (const r of histRows) {
      const cnt = Number(r.cnt);
      total += cnt;
      if (r.status === "pending") pending = cnt;
      else if (r.status === "danger") danger = cnt;
      else if (r.status === "warn") warn = cnt;
      else if (r.status === "safe") safe = cnt;
      // status가 NULL(그 시점 이전 이력이 없는 대상자)인 그룹은 집계에서 제외됨
      // — 이 기능을 배포하기 이전 달은 이력이 없어 재구성이 불가능하다.
    }
  } else {
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
    total   = Number(statsRow?.total   ?? 0);
    pending = Number(statsRow?.pending ?? 0);
    danger  = Number(statsRow?.danger  ?? 0);
    warn    = Number(statsRow?.warn    ?? 0);
    safe    = Number(statsRow?.safe    ?? 0);
  }

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

  // 4. Check-in rate — real-time "safe" ratio among subjects expected to check in
  // (register_flag=0 대기자는 확인 대상이 아니므로 분모에서 제외; danger/warn 대상자가
  //  있으면 확인율이 자동으로 100% 미만이 되도록 위에서 계산한 실시간 safe/danger/warn을 재사용)
  const checkinTotal   = total - pending;
  const checkedInMonth = safe;
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
  let scopeCond: string | null = null;
  let scopeParams: (string | number)[] = [];

  if (districtIds != null) {
    if (districtIds.length > 0) {
      scopeCond = `d.dist_id IN (${districtIds.map(() => "?").join(",")})`;
      scopeParams = [...districtIds];
    }
  } else if (orgId) {
    scopeCond = "d.org_id = ?";
    scopeParams = [orgId];
  }

  let districtRows: DistrictRow[] = [];
  if (scopeCond) {
    if (isPastMonth) {
      const sql = `
        SELECT
          d.name,
          COUNT(DISTINCT u.user_id) AS total,
          SUM(CASE WHEN latest.status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN latest.status = 'danger'  THEN 1 ELSE 0 END) AS danger,
          SUM(CASE WHEN latest.status = 'warn'    THEN 1 ELSE 0 END) AS warn,
          COUNT(DISTINCT CASE WHEN a.role = 'social_worker' AND a.active_flag = 1 AND a.withdraw_flag = 0 THEN a.admin_id END) AS worker_count
        FROM districts d
        LEFT JOIN users u ON u.district_id = d.dist_id AND u.active_flag = 1 AND u.joined_at < ?
        ${LATEST_STATUS_JOIN}
        LEFT JOIN admin_districts ad ON ad.district_id = d.dist_id
        LEFT JOIN admins a ON a.admin_id = ad.admin_id
        WHERE ${scopeCond}
        GROUP BY d.dist_id, d.name
        ORDER BY total DESC`;
      const { rows } = await query<DistrictRow>(sql, [monthEnd, monthEnd, ...scopeParams]);
      districtRows = rows;
    } else {
      const sql = `
        SELECT
          d.name,
          COUNT(DISTINCT u.user_id) AS total,
          SUM(CASE WHEN u.register_flag = 0 THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
          SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                       AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                       AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
                  THEN 1 ELSE 0 END) AS warn,
          COUNT(DISTINCT CASE WHEN a.role = 'social_worker' AND a.active_flag = 1 AND a.withdraw_flag = 0 THEN a.admin_id END) AS worker_count
        FROM districts d
        LEFT JOIN users u ON u.district_id = d.dist_id AND u.active_flag = 1
        LEFT JOIN admin_districts ad ON ad.district_id = d.dist_id
        LEFT JOIN admins a ON a.admin_id = ad.admin_id
        WHERE ${scopeCond}
        GROUP BY d.dist_id, d.name
        ORDER BY total DESC`;
      const { rows } = await query<DistrictRow>(sql, scopeParams);
      districtRows = rows;
    }
  }

  const districts = districtRows.map((r) => {
    const dTotal     = Number(r.total);
    const dPending   = Number(r.pending);
    const dDanger    = Number(r.danger);
    const dWarn      = Number(r.warn);
    const dExpected  = dTotal - dPending;
    const dRate      = dExpected > 0 ? Math.round(((dExpected - dDanger - dWarn) / dExpected) * 100) : 0;
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
