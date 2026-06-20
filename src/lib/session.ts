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

const ROLE_LABEL: Record<AdminSession["role"], string> = {
  superadmin:   "최고관리자",
  admin:        "관리자",
  social_worker:"복지사",
  viewer:       "조회자",
};

export function getAdminHeaderInfo(session: AdminSession | null) {
  return {
    user:        session?.name        ?? "",
    role:        session ? ROLE_LABEL[session.role] : "",
    userInitial: session?.name.charAt(0) ?? "?",
  };
}
