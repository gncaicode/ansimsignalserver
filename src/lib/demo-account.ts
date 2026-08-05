// 로그인 페이지 "체험 계정으로 둘러보기" 전용 데모 계정 — 자격정보가 공개돼 있어 별도 취급이 필요하다.
export const DEMO_ADMIN_EMAIL = "paldal@suwon.go.kr";

export function isDemoAccount(email: string): boolean {
  return email === DEMO_ADMIN_EMAIL;
}
