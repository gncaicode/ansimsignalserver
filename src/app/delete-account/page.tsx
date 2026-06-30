import { DeleteRequestForm } from "./DeleteRequestForm";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-xl">

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-blue-700 p-3">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.274-.636-4.399-1.741-6.205" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">안심시그널</h1>
          <p className="mt-1 text-sm text-slate-500">GNC AI Tech</p>
        </div>

        {/* 안내 카드 */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">계정 삭제 요청</h2>

          <div className="space-y-5 text-sm text-slate-700">

            {/* 처리 절차 */}
            <section>
              <h3 className="font-semibold text-slate-800 mb-2">삭제 요청 방법</h3>
              <ol className="space-y-2 list-none">
                {[
                  "아래 양식에 이름과 앱에 등록된 전화번호를 입력합니다.",
                  "'계정 삭제 요청하기' 버튼을 눌러 요청을 제출합니다.",
                  "영업일 기준 5일 이내에 처리 완료 후 담당자가 결과를 안내합니다.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <hr className="border-slate-100" />

            {/* 삭제 데이터 목록 */}
            <section>
              <h3 className="font-semibold text-slate-800 mb-2">삭제되는 데이터</h3>
              <ul className="space-y-1.5">
                {[
                  { label: "서비스 인증 토큰", desc: "앱 로그인에 사용되는 인증 정보" },
                  { label: "안부 신호 전송 기록", desc: "체크인 시각 및 상태 이력" },
                  { label: "체크인 주기 설정", desc: "안부 확인 알림 주기 설정값" },
                ].map((item) => (
                  <li key={item.label} className="flex gap-2">
                    <span className="mt-0.5 text-red-500">✕</span>
                    <span>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-slate-500"> — {item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* 보관 데이터 안내 */}
            <section>
              <h3 className="font-semibold text-slate-800 mb-2">보관되는 데이터</h3>
              <p className="text-slate-600">
                이름, 주소 등 기본 정보는 복지사 관리 시스템에서 관리하는 데이터로,
                해당 기관 담당자와 별도 협의 후 처리됩니다.
                삭제 요청 접수 후 복지기관으로 연락을 드립니다.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* 이메일 문의 안내 */}
            <section className="rounded-lg bg-slate-50 px-4 py-3 text-slate-600">
              <p>
                이메일로 문의하실 경우:{" "}
                <a
                  href="mailto:gncai.contact@gmail.com"
                  className="font-medium text-blue-700 hover:underline"
                >
                  gncai.contact@gmail.com
                </a>
              </p>
            </section>

          </div>
        </div>

        {/* 삭제 요청 양식 */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">삭제 요청 양식</h2>
          <DeleteRequestForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2024 GNC AI Tech. All rights reserved.
        </p>
      </div>
    </div>
  );
}
