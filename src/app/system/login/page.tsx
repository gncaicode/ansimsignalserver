import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SystemLoginForm } from "./SystemLoginForm";

export const metadata = { title: "시스템 관리자 로그인" };

export default function SystemLoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      {/* 좌측 브랜드 패널 */}
      <div className="hidden lg:flex relative flex-col justify-between bg-gradient-to-br from-trust-700 via-trust-800 to-trust-900 p-12 text-white">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          <Logo locale="ko" invert />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-snug tracking-tight">
            시스템 관리자
            <br />
            전용 로그 조회
          </h2>
          <p className="mt-5 text-trust-100/90 leading-relaxed">
            모든 기관의 접속 로그 및 개인정보 접근 로그를 조회할 수 있는 시스템 관리자 전용 화면입니다.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-trust-100/90">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              접속 로그 및 개인정보 접근 이력 조회
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              전체 기관 통합 조회
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              1년간 안전하게 보관된 로그 데이터
            </li>
          </ul>
        </div>
        <div className="relative text-xs text-trust-100/60">
          © {new Date().getFullYear()} 지앤씨 · 모든 권리 보유.
        </div>
      </div>

      {/* 우측 폼 */}
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6">
            <Logo locale="ko" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">시스템 관리자 로그인</h1>
          <p className="mt-2 text-sm text-muted">시스템 비밀번호를 입력하여 로그 조회 화면에 접속하세요.</p>
          <div className="mt-8">
            <SystemLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
