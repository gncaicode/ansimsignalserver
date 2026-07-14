import { query } from "./db";
import type { RowDataPacket } from "mysql2";
import type { Subject, ActivityLogEntry, SignalStatus, ManagerRole, ApprovalStatus } from "./types";

// MySQL DATETIME(KST) 문자열 → ISO 8601 KST 문자열 ("+09:00" 명시)
// mysql2는 타임존 없이 반환하므로, 이후 new Date()가 로컬 시간으로 파싱하는 버그 방지
function toIsoKst(s: string): string {
  return (s.includes('T') ? s : s.replace(' ', 'T')) + '+09:00';
}

// last_checkin_at + interval_hours 기반 실시간 상태 계산 (Flutter 앱과 동일 로직)
// registerFlag=0이면 앱 미연결 → 대기
export function calcSignalStatus(lastCheckinAt: string | null, intervalHours: number, registerFlag = 1): SignalStatus {
  if (registerFlag === 0) return "pending";
  if (!lastCheckinAt) return "safe";
  const remainingMs = new Date(toIsoKst(lastCheckinAt)).getTime() + intervalHours * 3_600_000 - Date.now();
  if (remainingMs < 0) return "danger";
  if (remainingMs < (intervalHours / 12) * 3_600_000) return "warn";
  return "safe";
}

// KST 현재 시각 SQL 표현 — MySQL 서버가 KST이므로 NOW() 그대로 사용
const NOW_KST = 'NOW()';

// 복지사 구역 필터 헬퍼
// districtIds가 배열이면 복지사 필터(IN 절), null이면 orgId 기준
function districtFilter(districtIds: number[] | null | undefined, orgId: number | null) {
  if (districtIds != null) {
    if (districtIds.length === 0) return { cond: "AND 1=0", params: [] as (number | string | null)[] };
    const ph = districtIds.map(() => "?").join(",");
    return { cond: `AND u.district_id IN (${ph})`, params: districtIds as (number | string | null)[] };
  }
  if (orgId) return { cond: "AND d.org_id = ?", params: [orgId] as (number | string | null)[] };
  return { cond: "", params: [] as (number | string | null)[] };
}

// 동적 위급·주의 판단 SQL 조건 (DB status 컬럼 미사용)
// 위급: 기간 초과, 주의: 0 <= 남은시간 < interval/12
const DYNAMIC_CRITICAL_COND = `
  u.register_flag = 1 AND u.last_checkin_at IS NOT NULL AND (
    ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
    OR TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
  )
`;

/* ───────── 통계 ───────── */
interface StatsRow extends RowDataPacket {
  total: number;
  danger: number;
  warn: number;
  safe: number;
  pending: number;
}

export async function getDashboardStats(orgId: number | null, districtIds?: number[] | null) {
  const f = districtFilter(districtIds, orgId);
  const filterJoin = (districtIds != null) ? "" : orgId ? "LEFT JOIN districts d ON u.district_id = d.dist_id" : "";
  const { rows } = await query<StatsRow>(
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
    f.params
  );
  const r = rows[0];
  return {
    total:   Number(r?.total   ?? 0),
    pending: Number(r?.pending ?? 0),
    danger:  Number(r?.danger  ?? 0),
    warn:    Number(r?.warn    ?? 0),
    safe:    Number(r?.safe    ?? 0),
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
  register_flag: number;
  district_name: string | null;
  admin_name: string | null;
}

export async function getCriticalUsers(orgId: number | null, districtIds?: number[] | null): Promise<Subject[]> {
  const f = districtFilter(districtIds, orgId);
  const { rows } = await query<UserRow>(
    `SELECT
       u.user_id, u.name, u.age, u.address, u.emergency_phone,
       u.last_checkin_at, u.alert_sent_at, u.status, u.interval_hours, u.register_flag,
       d.name AS district_name,
       GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS admin_name
     FROM users u
     LEFT JOIN districts       d  ON u.district_id  = d.dist_id
     LEFT JOIN admin_districts ad ON u.district_id  = ad.district_id
     LEFT JOIN admins          a  ON ad.admin_id    = a.admin_id
                                  AND a.role = 'social_worker'
                                  AND a.active_flag = 1
                                  AND a.withdraw_flag = 0
     WHERE u.active_flag = 1
       AND (${DYNAMIC_CRITICAL_COND})
       ${f.cond}
     GROUP BY u.user_id, u.name, u.age, u.address, u.emergency_phone,
              u.last_checkin_at, u.alert_sent_at, u.status, u.interval_hours, u.register_flag,
              d.name
     ORDER BY
       CASE WHEN ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 0 ELSE 1 END,
       u.last_checkin_at ASC
     LIMIT 20`,
    f.params
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
      status:                calcSignalStatus(u.last_checkin_at, u.interval_hours, u.register_flag),
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

export async function getDistrictBreakdown(orgId: number | null, districtIds?: number[] | null) {
  const f = districtFilter(districtIds, orgId);
  const { rows } = await query<DistrictRow>(
    `SELECT
       d.name,
       COUNT(*) AS total,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 1 ELSE 0 END) AS danger,
       SUM(CASE WHEN u.last_checkin_at IS NOT NULL
                     AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)
                     AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0
                THEN 1 ELSE 0 END) AS warn
     FROM users u
     JOIN districts d ON u.district_id = d.dist_id
     WHERE u.active_flag = 1 AND u.register_flag = 1
       ${f.cond}
     GROUP BY d.dist_id, d.name
     ORDER BY total DESC`,
    f.params
  );

  return rows.map((r) => {
    const total    = Number(r.total);
    const danger   = Number(r.danger);
    const warn     = Number(r.warn);
    const safe     = total - danger - warn;
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
  register_flag: number;
  admin_name: string | null;
}

export async function getActivityLog(orgId: number | null, districtIds?: number[] | null): Promise<ActivityLogEntry[]> {
  const f = districtFilter(districtIds, orgId);
  const { rows } = await query<LogRow>(
    `SELECT
       u.user_id, u.name, u.last_checkin_at, u.alert_sent_at, u.interval_hours, u.register_flag,
       d.name AS district_name,
       GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS admin_name
     FROM users u
     LEFT JOIN districts       d  ON u.district_id  = d.dist_id
     LEFT JOIN admin_districts ad ON u.district_id  = ad.district_id
     LEFT JOIN admins          a  ON ad.admin_id    = a.admin_id
                                  AND a.role = 'social_worker'
                                  AND a.active_flag = 1
                                  AND a.withdraw_flag = 0
     WHERE u.active_flag = 1
       AND (u.last_checkin_at IS NOT NULL OR u.alert_sent_at IS NOT NULL)
       ${f.cond}
     GROUP BY u.user_id, u.name, u.last_checkin_at, u.alert_sent_at, u.interval_hours, u.register_flag,
              d.name
     ORDER BY GREATEST(
       COALESCE(u.last_checkin_at, '1970-01-01'),
       COALESCE(u.alert_sent_at,  '1970-01-01')
     ) DESC
     LIMIT 15`,
    f.params
  );

  const entries: ActivityLogEntry[] = [];

  for (const u of rows) {
    const status = calcSignalStatus(u.last_checkin_at, u.interval_hours, u.register_flag);
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

export async function getAlertCount(orgId: number | null, districtIds?: number[] | null): Promise<number> {
  if (!orgId && (districtIds == null || districtIds.length === 0)) return 0;
  const f = districtFilter(districtIds, orgId);
  const { rows } = await query<AlertCountRow>(
    `SELECT COUNT(*) AS cnt
     FROM users u
     JOIN districts d ON u.district_id = d.dist_id
     WHERE u.active_flag = 1
       ${f.cond}
       AND (${DYNAMIC_CRITICAL_COND})`,
    f.params
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
  checkin_mode: "manual" | "appOpen" | "passive";
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
  checkin_mode: "manual" | "appOpen" | "passive";
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
  q?: string,
  districtIds?: number[] | null,
): Promise<{ users: UserListItem[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const statusCond = statusFilter && statusFilter !== "all"
    ? statusFilter === "pending"
      ? `AND u.register_flag = 0`
      : statusFilter === "danger"
        ? `AND u.register_flag = 1 AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)`
        : statusFilter === "warn"
          ? `AND u.register_flag = 1 AND u.last_checkin_at IS NOT NULL AND ${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0`
          : `AND u.register_flag = 1 AND (u.last_checkin_at IS NULL OR (${NOW_KST} <= DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 >= u.interval_hours / 12.0))`
    : "";
  const f = districtFilter(districtIds, orgId);
  const searchCond = q
    ? `AND (u.name LIKE ? OR u.address LIKE ? OR EXISTS (
         SELECT 1 FROM admin_districts sad
         JOIN admins sa ON sa.admin_id = sad.admin_id
                       AND sa.role = 'social_worker'
                       AND sa.active_flag = 1
                       AND sa.withdraw_flag = 0
         WHERE sad.district_id = u.district_id AND sa.name LIKE ?
       ))`
    : "";
  const likeVal = q ? `%${q}%` : null;

  const params: (string | number | null)[] = [...f.params];
  if (likeVal) params.push(likeVal, likeVal, likeVal);

  const { rows: countRows } = await query<RowDataPacket & { total: number }>(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     WHERE u.active_flag = 1 ${statusCond} ${f.cond} ${searchCond}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const { rows } = await query<UserListRow>(
    `SELECT
       u.user_id, u.name, u.age, u.address, u.emergency_phone,
       u.last_checkin_at, u.status, u.interval_hours, u.checkin_mode, u.register_flag,
       d.name AS district_name,
       GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS admin_name,
       ic.code AS invite_code
     FROM users u
     LEFT JOIN districts      d  ON u.district_id  = d.dist_id
     LEFT JOIN admin_districts ad ON u.district_id  = ad.district_id
     LEFT JOIN admins          a  ON ad.admin_id    = a.admin_id
                                  AND a.role = 'social_worker'
                                  AND a.active_flag = 1
                                  AND a.withdraw_flag = 0
     LEFT JOIN invite_codes   ic ON ic.code_id = (
       SELECT code_id FROM invite_codes WHERE user_id = u.user_id AND used = 0 ORDER BY code_id DESC LIMIT 1
     )
     WHERE u.active_flag = 1 ${statusCond} ${f.cond} ${searchCond}
     GROUP BY u.user_id, u.name, u.age, u.address, u.emergency_phone,
              u.last_checkin_at, u.status, u.interval_hours, u.checkin_mode, u.register_flag,
              d.name
     ORDER BY
       CASE WHEN u.last_checkin_at IS NOT NULL AND ${NOW_KST} > DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR) THEN 0
            WHEN u.last_checkin_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, ${NOW_KST}, DATE_ADD(u.last_checkin_at, INTERVAL u.interval_hours HOUR)) / 3600.0 < u.interval_hours / 12.0 THEN 1
            ELSE 2 END,
       u.last_checkin_at ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return {
    total,
    users: rows.map((r) => ({
      ...r,
      status: calcSignalStatus(r.last_checkin_at, r.interval_hours, r.register_flag),
    })),
  };
}

/* ───────── 대상자 상세 ───────── */
interface UserDetailRow extends RowDataPacket {
  user_id: number;
  name: string;
  age: number;
  address: string;
  emergency_phone: string;
  last_checkin_at: string | null;
  interval_hours: number;
  checkin_mode: "manual" | "appOpen" | "passive";
  register_flag: number;
  district_name: string | null;
  admin_name: string | null;
}

export interface UserDetail {
  user_id: number;
  name: string;
  age: number;
  address: string;
  emergency_phone: string;
  last_checkin_at: string | null;
  interval_hours: number;
  checkin_mode: "manual" | "appOpen" | "passive";
  register_flag: number;
  district_name: string | null;
  admin_name: string | null;
  status: SignalStatus;
}

export async function getUserById(
  userId: number,
  orgId: number | null,
): Promise<UserDetail | null> {
  const { rows } = await query<UserDetailRow>(
    `SELECT
       u.user_id, u.name, u.age, u.address, u.emergency_phone,
       u.last_checkin_at, u.interval_hours, u.checkin_mode, u.register_flag,
       d.name AS district_name,
       GROUP_CONCAT(a.name ORDER BY a.name SEPARATOR ', ') AS admin_name
     FROM users u
     LEFT JOIN districts       d  ON u.district_id  = d.dist_id
     LEFT JOIN admin_districts ad ON u.district_id  = ad.district_id
     LEFT JOIN admins          a  ON ad.admin_id    = a.admin_id
                                  AND a.role = 'social_worker'
                                  AND a.active_flag = 1
                                  AND a.withdraw_flag = 0
     WHERE u.user_id = ? AND u.active_flag = 1
       ${orgId ? "AND d.org_id = ?" : ""}
     GROUP BY u.user_id, u.name, u.age, u.address, u.emergency_phone,
              u.last_checkin_at, u.interval_hours, u.checkin_mode, u.register_flag,
              d.name
     LIMIT 1`,
    orgId ? [userId, orgId] : [userId],
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return { ...r, status: calcSignalStatus(r.last_checkin_at, r.interval_hours, r.register_flag) };
}

interface ActionLogRow extends RowDataPacket {
  log_id: number;
  action_type: string;
  note: string | null;
  created_at: string;
  admin_name: string | null;
}

export interface ActionLog {
  log_id: number;
  action_type: string;
  note: string | null;
  created_at: string;
  admin_name: string | null;
}

export async function getActionLogs(userId: number): Promise<ActionLog[]> {
  const { rows } = await query<ActionLogRow>(
    `SELECT l.log_id, l.action_type, l.note, l.created_at, a.name AS admin_name
     FROM action_logs l
     LEFT JOIN admins a ON l.admin_id = a.admin_id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [userId],
  );
  return rows;
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

interface AdminOptionRow extends RowDataPacket { id: number; name: string; district_ids_str: string | null; }

export async function getAdminOptions(orgId: number | null): Promise<{ id: number; name: string; district_ids: number[] }[]> {
  if (!orgId) return [];
  const { rows } = await query<AdminOptionRow>(
    `SELECT a.admin_id AS id, a.name,
       GROUP_CONCAT(ad.district_id ORDER BY ad.district_id SEPARATOR ',') AS district_ids_str
     FROM admins a
     LEFT JOIN admin_districts ad ON a.admin_id = ad.admin_id
     WHERE a.organization_id = ? AND a.active_flag = 1 AND a.withdraw_flag = 0 AND a.role != 'superadmin'
     GROUP BY a.admin_id, a.name
     ORDER BY a.name`,
    [orgId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    district_ids: r.district_ids_str ? r.district_ids_str.split(",").map(Number) : [],
  }));
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
  district_ids: number[];
  district_names: string | null;
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
  district_ids_str: string | null;
  district_names: string | null;
}

export async function getAdmins(orgId: number | null): Promise<AdminListItem[]> {
  const { rows } = await query<AdminListRow>(
    `SELECT
       a.admin_id, a.name, a.email, a.phone, a.position, a.department,
       a.role, a.active_flag, a.withdraw_flag, a.joined_at,
       o.name AS org_name,
       GROUP_CONCAT(ad.district_id ORDER BY d.name SEPARATOR ',') AS district_ids_str,
       GROUP_CONCAT(d.name         ORDER BY d.name SEPARATOR ', ') AS district_names
     FROM admins a
     LEFT JOIN organizations  o  ON a.organization_id = o.org_id
     LEFT JOIN admin_districts ad ON a.admin_id = ad.admin_id
     LEFT JOIN districts       d  ON ad.district_id = d.dist_id
     WHERE a.withdraw_flag = 0
       AND a.role != 'superadmin'
       ${orgId ? "AND a.organization_id = ?" : ""}
     GROUP BY a.admin_id, a.name, a.email, a.phone, a.position, a.department,
              a.role, a.active_flag, a.withdraw_flag, a.joined_at, o.name
     ORDER BY FIELD(a.role,'admin','social_worker','viewer'), a.joined_at DESC`,
    orgId ? [orgId] : [],
  );

  return rows.map((r) => ({
    admin_id:       r.admin_id,
    name:           r.name,
    email:          r.email,
    phone:          r.phone,
    position:       r.position,
    department:     r.department,
    role:           ROLE_MAP[r.role] ?? "viewer",
    dbRole:         r.role,
    approvalStatus: toApprovalStatus(r.active_flag, r.withdraw_flag),
    org_name:       r.org_name,
    joined_at:      r.joined_at,
    district_ids:   r.district_ids_str ? r.district_ids_str.split(",").map(Number) : [],
    district_names: r.district_names ?? null,
  }));
}
