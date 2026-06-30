import "../globals.css";

export const metadata = {
  title: "계정 삭제 요청 | 안심시그널",
  description: "안심시그널 앱 계정 및 관련 데이터 삭제 요청 페이지",
};

export default function DeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
