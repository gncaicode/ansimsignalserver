import { query } from "./db";
import type { RowDataPacket } from "mysql2";

// 체험(무상) 사용 조건
export const TRIAL_DAYS = 90;
export const TRIAL_USER_LIMIT = 30;
export const TRIAL_EXTEND_DAYS = 30;

export type PlanStatus = "trial" | "active" | "suspended";

export interface OrgPlan {
  status: PlanStatus;
  trialEndsAt: string | null; // KST 'YYYY-MM-DD HH:mm:ss'
  trialExpired: boolean;
  daysLeft: number | null;    // 체험 남은 일수 (체험이 아니거나 시작 전이면 null)
  userLimit: number | null;   // null = 제한 없음
  userCount: number;
  verified: boolean;
}

// 공공기관 메일 도메인 — 이메일 인증만으로 기관 확인을 통과시킨다.
export function isPublicDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domain === "korea.kr" || domain.endsWith(".go.kr");
}

interface PlanRow extends RowDataPacket {
  plan_status: PlanStatus;
  trial_ends_at: string | null;
  user_limit: number | null;
  verified_at: string | null;
  days_left: number | null;
  expired: number;
}
interface CountRow extends RowDataPacket { cnt: number; }

// 기관의 활성 대상자 수. 대시보드와 같이 구역으로 기관을 판단하고,
// 구역 없이 등록된 대상자는 담당 운영자 또는 초대코드를 발급한 운영자의 기관으로 센다.
// (초대코드는 앱 가입 후에도 used 표시만 남으므로 대상자마다 항상 남아 있다)
export async function countOrgUsers(orgId: number): Promise<number> {
  const { rows } = await query<CountRow>(
    `SELECT COUNT(*) AS cnt
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.dist_id
     LEFT JOIN admins a ON u.admin_id = a.admin_id
     WHERE u.active_flag = 1
       AND (d.org_id = ? OR (u.district_id IS NULL AND (
             a.organization_id = ?
             OR EXISTS (SELECT 1 FROM invite_codes ic JOIN admins ia ON ia.admin_id = ic.admin_id
                        WHERE ic.user_id = u.user_id AND ia.organization_id = ?))))`,
    [orgId, orgId, orgId],
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function getOrgPlan(orgId: number): Promise<OrgPlan | null> {
  const { rows } = await query<PlanRow>(
    `SELECT plan_status, trial_ends_at, user_limit, verified_at,
            CASE WHEN trial_ends_at IS NULL THEN NULL
                 ELSE GREATEST(0, CEIL(TIMESTAMPDIFF(MINUTE, NOW(), trial_ends_at) / 1440)) END AS days_left,
            (trial_ends_at IS NOT NULL AND trial_ends_at < NOW()) AS expired
     FROM organizations WHERE org_id = ?`,
    [orgId],
  );
  const row = rows[0];
  if (!row) return null;
  const isTrial = row.plan_status === "trial";
  return {
    status: row.plan_status,
    trialEndsAt: row.trial_ends_at,
    trialExpired: isTrial && Number(row.expired) === 1,
    daysLeft: isTrial && row.days_left !== null ? Number(row.days_left) : null,
    userLimit: row.user_limit,
    userCount: await countOrgUsers(orgId),
    verified: row.verified_at !== null,
  };
}

// 등록·수정 같은 쓰기 작업이 가능한지. 불가능하면 사용자에게 보여줄 사유를 돌려준다.
// 조치 기록처럼 대상자 안전과 직결된 작업에는 쓰지 않는다.
function writeBlockReason(plan: OrgPlan): string | null {
  if (plan.status === "suspended") return "이용이 정지된 기관입니다. 운영사에 문의해 주세요.";
  if (plan.trialExpired) return "체험 기간이 끝나 새로 등록하거나 수정할 수 없습니다. 운영사에 문의해 주세요.";
  return null;
}

export async function getWriteBlockReason(orgId: number | null): Promise<string | null> {
  const plan = orgId ? await getOrgPlan(orgId) : null;
  return plan ? writeBlockReason(plan) : null;
}

// 대상자를 adding명 더 등록할 수 있는지. 불가능하면 사유를 돌려준다.
export async function getUserAddBlockReason(orgId: number | null, adding = 1): Promise<string | null> {
  const plan = orgId ? await getOrgPlan(orgId) : null;
  if (!plan) return null;
  const writeBlock = writeBlockReason(plan);
  if (writeBlock) return writeBlock;
  if (plan.userLimit != null && plan.userCount + adding > plan.userLimit) {
    return `등록 가능한 대상자 수(${plan.userLimit}명)를 넘습니다. 현재 ${plan.userCount}명이 등록되어 있습니다.`;
  }
  return null;
}
