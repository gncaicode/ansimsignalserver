import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface AdminSession {
  admin_id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "social_worker" | "viewer";
  organization_id: number | null;
}

export async function createSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };

const ROLE_LABEL: Record<AdminSession["role"], Record<string, string>> = {
  superadmin:   { ko: "최고관리자", ja: "最高管理者" },
  admin:        { ko: "관리자",     ja: "管理者" },
  social_worker:{ ko: "복지사",     ja: "福祉士" },
  viewer:       { ko: "조회자",     ja: "閲覧者" },
};

export function getAdminHeaderInfo(session: AdminSession | null, locale = "ko") {
  return {
    user:        session?.name        ?? "",
    role:        session ? (ROLE_LABEL[session.role][locale] ?? ROLE_LABEL[session.role]["ko"]) : "",
    userInitial: session?.name.charAt(0) ?? "?",
  };
}
