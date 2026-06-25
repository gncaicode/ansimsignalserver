import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SYSTEM_COOKIE = "system_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET! + "_system");

export async function createSystemSession(): Promise<string> {
  return new SignJWT({ role: "system" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySystemToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getSystemSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SYSTEM_COOKIE)?.value;
  if (!token) return false;
  return verifySystemToken(token);
}
