import { SystemLoginForm } from "./SystemLoginForm";

export const metadata = { title: "시스템 로그인" };

export default function SystemLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">시스템 관리자</h1>
          <p className="text-sm text-gray-500 mt-1">로그 조회 시스템</p>
        </div>
        <SystemLoginForm />
      </div>
    </div>
  );
}
