import { query } from "./db";
import type { RowDataPacket } from "mysql2";
import type { Subject, ActivityLogEntry, SignalStatus, ManagerRole, ApprovalStatus } from "./types";

// MySQL DATETIME(KST) 문자열 → ISO 8601 KST 문자열 ("+09:00" 명시)
// mysql2는 타임존 없이 반환하므로, 이후 new Date()가 로컬 시간으로 파싱하는 버그 방지
function toIsoKst(s: string): string {
  return (s.includes('T') ? s : s.replace(' ', 'T')) + '+09:00';
}

// last_checkin_at + interval_hours 기반 실시간 상태 계산 (Flutter 앱과 동일 로직)
function calcSignalStatus(lastCheckinAt: string | null, intervalHours: number): SignalStatus {
  if (!lastCheckinAt) return "safe";
  const remainingMs = new Date(toIsoKst(lastCheckinAt)).getTime() + intervalHours * 3_600_000 - Date.now();
  if (remainingMs < 0) return "danger";
  if (remainingMs < (intervalHours / 3) * 3_600_000) return "warn";
  return "safe";
}

// KST 현재 시각 SQL 표현 — MySQL 서버가 UTC이므로 +9시간 보정
const NOW_KST = '(NOW() + INTERVAL 9 HOUR)';

// 동적 위급·주의 판단 SQL 조건 (DB status 컬럼 미사용)
const DYNAMIC_CRITICAL_COND = `
  u.last_checkin_at IS NOT NULL AND (
    ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
    OR TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 3.0
  )
`;

/* ───────── 통계 ───────── */
interface StatsRow extends RowDataPacket {
  total: number;
  danger: number;
  warn: number;
  safe: number;
}

export async function getDashboardStats(orgId: number | null) {
  const { rows } = await query<StatsRow>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                     AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                     AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 3.0
                THEN 1 ELSE 0 END) AS warn,
       SUM(CASE WHEN u.last_checkin_at IS NULL
                     OR (${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                         AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 >= u.interval_hours / 3.0)
                THEN 1 ELSE 0 END) AS safe
     FROM users u
     ${orgId ? "LEFT JOIN districts d ON u.district_id = d.dist_id WHERE u.active_flag = 1 AND d.org_id = ?" : "WHERE u.active_flag = 1"}`,
    orgId ? [orgId] : []
  );
  const r = rows[0];
  return {
    total:  Number(r?.total  ?? 0),
    danger: Number(r?.danger ?? 0),
    warn:   Number(r?.warn   ?? 0),
    safe:   Number(r?.safe   ?? 0),
  };
}

/* ───────── 위급·주의 대상자 ───────── */
interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  age: number;
  address: string;
  emergency_phone: string;
  last_checkin_at: string | null;
  alert_sent_at: string | null;
  status: string;
  interval_hours: number;
  district_name: string | null;
  admin_name: string | null;
}

export async function getCriticalUsers(orgId: number | null): Promise<Subject[]> {
  const { rows } = await query<UserRow>(
    `SELECT
       u.user_id, u.name, u.age, u.address, u.emergency_phone,
       u.last_checkin_at, u.alert_sent_at, u.status, u.interval_hours,
       d.name AS district_name,
       a.name AS admin_name
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     LEFT JOIN admins    a ON u.admin_id    = a.admin_id
     WHERE u.active_flag = 1
       AND (${DYNAMIC_CRITICAL_COND})
       ${orgId ? "AND d.org_id = ?" : ""}
     ORDER BY
       CASE WHEN ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 0 ELSE 1 END,
       u.last_checkin_at ASC
     LIMIT 20`,
    orgId ? [orgId] : []
  );

  return rows.map((u) => {
    const lastCheckIn = u.last_checkin_at ? toIsoKst(u.last_checkin_at) : new Date().toISOString();
    const diffMs = Date.now() - new Date(lastCheckIn).getTime();
    const hoursSince = Math.round(diffMs / 3_600_000);

    return {
      id:                    String(u.user_id),
      name:                  u.name,
      age:                   u.age,
      gender:                "M" as const, // DB에 없음 — 임시값
      district:              u.district_name ?? "",
      addressDetail:         u.address,
      emergencyContactName:  u.emergency_phone,
      emergencyContactPhone: u.emergency_phone,
      caseworker:            u.admin_name ?? "",
      lastCheckIn,
      hoursSinceLastCheckIn: hoursSince,
      status:                calcSignalStatus(u.last_checkin_at, u.interval_hours),
    };
  });
}

/* ───────── 구역별 현황 ───────── */
interface DistrictRow extends RowDataPacket {
  name: string;
  total: number;
  danger: number;
  warn: number;
}

export async function getDistrictBreakdown(orgId: number | null) {
  const { rows } = await query<DistrictRow>(
    `SELECT
       d.name,
       COUNT(*) AS total,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                     AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                     AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 3.0
                THEN 1 ELSE 0 END) AS warn
     FROM users u
     JOIN districts d ON u.district_id = d.dist_id
     WHERE u.active_flag = 1
       ${orgId ? "AND d.org_id = ?" : ""}
     GROUP BY d.dist_id, d.name
     ORDER BY total DESC`,
    orgId ? [orgId] : []
  );

  return rows.map((r) => {
    const total  = Number(r.total);
    const danger = Number(r.danger);
    const warn   = Number(r.warn);
    const safe   = total - danger - warn;
    const response = total > 0 ? Math.round((safe / total) * 100) : 100;
    return { name: r.name, total, danger, warn, response };
  });
}

/* ───────── 최근 활동 로그 (체크인 + 알림) ───────── */
interface LogRow extends RowDataPacket {
  user_id: number;
  name: string;
  district_name: string | null;
  last_checkin_at: string | null;
  alert_sent_at: string | null;
  interval_hours: number;
  admin_name: string | null;
}

export async function getActivityLog(orgId: number | null): Promise<ActivityLogEntry[]> {
  const { rows } = await query<LogRow>(
    `SELECT
       u.user_id, u.name, u.last_checkin_at, u.alert_sent_at, u.interval_hours,
       d.name AS district_name,
       a.name AS admin_name
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     LEFT JOIN admins    a ON u.admin_id    = a.admin_id
     WHERE u.active_flag = 1
       AND (u.last_checkin_at IS NOT NULL OR u.alert_sent_at IS NOT NULL)
       ${orgId ? "AND d.org_id = ?" : ""}
     ORDER BY GREATEST(
       COALESCE(u.last_checkin_at, '1970-01-01'),
       COALESCE(u.alert_sent_at,  '1970-01-01')
     ) DESC
     LIMIT 15`,
    orgId ? [orgId] : []
  );

  const entries: ActivityLogEntry[] = [];

  for (const u of rows) {
    const status = calcSignalStatus(u.last_checkin_at, u.interval_hours);
    const district = u.district_name ?? "";

    if (u.alert_sent_at) {
      entries.push({
        id:          `alert-${u.user_id}`,
        type:        "alert",
        subjectName: u.name,
        district,
        message:     `미확인 — 위급 알림 자동 발송${u.admin_name ? ` (담당: ${u.admin_name})` : ""}`,
        occurredAt:  toIsoKst(u.alert_sent_at),
        severity:    "danger",
      });
    } else if (u.last_checkin_at) {
      entries.push({
        id:          `checkin-${u.user_id}`,
        type:        "checkin",
        subjectName: u.name,
        district,
        message:     "안부 체크인 완료",
        occurredAt:  toIsoKst(u.last_checkin_at),
        severity:    status === "safe" ? "safe" : status,
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  ).slice(0, 10);
}

/* ───────── 기관명 ───────── */
interface OrgRow extends RowDataPacket { name: string; }

export async function getOrgName(orgId: number | null): Promise<string> {
  if (!orgId) return "";
  const { rows } = await query<OrgRow>(
    "SELECT name FROM organizations WHERE org_id = ? LIMIT 1",
    [orgId]
  );
  return rows[0]?.name ?? "";
}

interface AlertCountRow extends RowDataPacket { cnt: number; }

export async function getAlertCount(orgId: number | null): Promise<number> {
  if (!orgId) return 0;
  const { rows } = await query<AlertCountRow>(
    `SELECT COUNT(*) AS cnt
     FROM users u
     JOIN districts d ON u.district_id = d.dist_id
     WHERE d.org_id = ? AND u.active_flag = 1
       AND (${DYNAMIC_CRITICAL_COND})`,
    [orgId]
  );
  return rows[0]?.cnt ?? 0;
}

/* ───────── 대상자 목록 ───────── */
export interface UserListItem {
  user_id: number;
  name: string;
  age: number;
  address: string;
  emergency_phone: string;
  last_checkin_at: string | null;
  status: SignalStatus;
  interval_hours: number;
  district_name: string | null;
  admin_name: string | null;
  register_flag: number;
  invite_code: string | null;
}

interface UserListRow extends RowDataPacket {
  user_id: number;
  name: string;
  age: number;
  address: string;
  emergency_phone: string;
  last_checkin_at: string | null;
  status: string;
  interval_hours: number;
  district_name: string | null;
  admin_name: string | null;
  register_flag: number;
  invite_code: string | null;
}

export async function getUsers(
  orgId: number | null,
  statusFilter?: string,
  page = 1,
  pageSize = 20,
): Promise<{ users: UserListItem[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const statusCond = statusFilter && statusFilter !== "all"
    ? statusFilter === "danger"
      ? `AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)`
      : statusFilter === "warn"
        ? `AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 3.0`
        : `AND (u.last_checkin_at IS NULL OR (${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 >= u.interval_hours / 3.0))`
    : "";
  const orgCond = orgId ? "AND d.org_id = ?" : "";
  const params: (string | number)[] = [];
  if (orgId) params.push(orgId);

  const { rows: countRows } = await query<RowDataPacket & { total: number }>(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     WHERE u.active_flag = 1 ${statusCond} ${orgCond}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const { rows } = await query<UserListRow>(
    `SELECT
       u.user_id, u.name, u.age, u.address, u.emergency_phone,
       u.last_checkin_at, u.status, u.interval_hours, u.register_flag,
       d.name AS district_name,
       a.name AS admin_name,
       ic.code AS invite_code
     FROM users u
     LEFT JOIN districts    d  ON u.district_id = d.dist_id
     LEFT JOIN admins       a  ON u.admin_id    = a.admin_id
     LEFT JOIN invite_codes ic ON ic.user_id    = u.user_id AND ic.used = 0
     WHERE u.active_flag = 1 ${statusCond} ${orgCond}
     ORDER BY
       CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 0
            WHEN u.last_checkin_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 3.0 THEN 1
            ELSE 2 END,
       u.last_checkin_at ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return {
    total,
    users: rows.map((r) => ({
      ...r,
      status: calcSignalStatus(r.last_checkin_at, r.interval_hours),
    })),
  };
}

/* ───────── 폼용 간단 목록 ───────── */
interface SimpleRow extends RowDataPacket { id: number; name: string; }

export async function getDistrictOptions(orgId: number | null) {
  if (!orgId) return [];
  const { rows } = await query<SimpleRow>(
    "SELECT dist_id AS id, name FROM districts WHERE org_id = ? ORDER BY name",
    [orgId],
  );
  return rows;
}

export async function getAdminOptions(orgId: number | null) {
  if (!orgId) return [];
  const { rows } = await query<SimpleRow>(
    "SELECT admin_id AS id, name FROM admins WHERE organization_id = ? AND active_flag = 1 AND withdraw_flag = 0 ORDER BY name",
    [orgId],
  );
  return rows;
}

/* ───────── 운영자 목록 ───────── */

// DB role → i18n ManagerRole 매핑
const ROLE_MAP: Record<string, ManagerRole> = {
  superadmin:   "admin",
  admin:        "supervisor",
  social_worker:"worker",
  viewer:       "viewer",
};

function toApprovalStatus(active_flag: number, withdraw_flag: number): ApprovalStatus {
  if (withdraw_flag === 1 || active_flag === 0) return "suspended";
  return "approved";
}

export interface AdminListItem {
  admin_id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: ManagerRole;
  dbRole: string;
  approvalStatus: ApprovalStatus;
  org_name: string | null;
  joined_at: string | null;
}

interface AdminListRow extends RowDataPacket {
  admin_id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: string;
  active_flag: number;
  withdraw_flag: number;
  org_name: string | null;
  joined_at: string | null;
}

export async function getAdmins(orgId: number | null): Promise<AdminListItem[]> {
  const { rows } = await query<AdminListRow>(
    `SELECT
       a.admin_id, a.name, a.email, a.phone, a.position, a.department,
       a.role, a.active_flag, a.withdraw_flag, a.joined_at,
       o.name AS org_name
     FROM admins a
     LEFT JOIN organizations o ON a.organization_id = o.org_id
     WHERE a.withdraw_flag = 0
       AND a.role != 'superadmin'
       ${orgId ? "AND a.organization_id = ?" : ""}
     ORDER BY FIELD(a.role,'admin','social_worker','viewer'), a.joined_at DESC`,
    orgId ? [orgId] : [],
  );

  return rows.map((r) => ({
    admin_id:      r.admin_id,
    name:          r.name,
    email:         r.email,
    phone:         r.phone,
    position:      r.position,
    department:    r.department,
    role:          ROLE_MAP[r.role] ?? "viewer",
    dbRole:        r.role,
    approvalStatus: toApprovalStatus(r.active_flag, r.withdraw_flag),
    org_name:      r.org_name,
    joined_at:     r.joined_at,
  }));
}
