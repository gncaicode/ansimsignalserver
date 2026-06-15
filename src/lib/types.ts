export type SignalStatus = "safe" | "warn" | "danger";

export interface Subject {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  district: string; // 관할 동/주소 요약
  addressDetail: string; // 상세 주소
  emergencyContactName: string;
  emergencyContactPhone: string;
  caseworker: string; // 담당 복지사
  lastCheckIn: string; // ISO timestamp
  hoursSinceLastCheckIn: number; // 시간 단위 경과
  status: SignalStatus;
  note?: string;
}

export type ManagerRole = "admin" | "supervisor" | "worker" | "viewer";
export type ApprovalStatus = "approved" | "pending" | "suspended";

export interface Manager {
  id: string;
  department: string;
  position: string;
  name: string;
  phone: string;
  email: string;
  role: ManagerRole;
  approvalStatus: ApprovalStatus;
  joinedAt: string;
}

export type LogType =
  | "checkin" // 대상자 안부 확인 완료
  | "alert" // 시스템 자동 알림 발송
  | "call" // 담당자 전화 조치
  | "visit" // 현장 방문 조치
  | "register"; // 신규 등록

export interface ActivityLogEntry {
  id: string;
  type: LogType;
  subjectName: string;
  district: string;
  message: string;
  actor?: string; // 조치자
  occurredAt: string; // ISO
  severity: SignalStatus;
}
