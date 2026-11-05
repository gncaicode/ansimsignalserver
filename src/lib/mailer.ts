import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendAlertEmail(
  to: string,
  userName: string,
  minutesOverdue: number
): Promise<void> {
  const hours = Math.floor(minutesOverdue / 60);
  const minutes = minutesOverdue % 60;
  const overdueText = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

  await transporter.sendMail({
    from: `"안심시그널" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[안심시그널] ${userName}님의 안부 신호가 없습니다`,
    text: `${userName}님이 위급 상태에 진입했습니다.\n\n위급 상태 진입 후 ${overdueText}이 경과했습니다.\n\n확인이 필요합니다.`,
    html: `
      <p><strong>${userName}</strong>님이 <strong>위급 상태</strong>에 진입했습니다.</p>
      <p>위급 상태 진입 후 <strong>${overdueText}</strong>이 경과했습니다.</p>
      <p>확인이 필요합니다.</p>
    `,
  });
}

// 메일 본문 링크용 사이트 주소. 프록시 뒤에서는 x-forwarded-proto를 따르고, 없으면 localhost만 http로 본다.
export function siteOrigin(headers: Headers): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3003';
  const proto = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<void> {
  await transporter.sendMail({
    from: `"안심시그널" <${process.env.GMAIL_USER}>`,
    to,
    subject: '[안심시그널] 이메일 인증을 완료해 주세요',
    text: `${name}님, 안심시그널 가입을 환영합니다.\n\n아래 링크를 열어 이메일 인증을 완료하면 바로 로그인할 수 있습니다. 링크는 24시간 동안 유효합니다.\n\n${verifyUrl}`,
    html: `
      <p>${name}님, 안심시그널 가입을 환영합니다.</p>
      <p>아래 버튼을 눌러 이메일 인증을 완료하면 바로 로그인할 수 있습니다.<br/>링크는 <strong>24시간</strong> 동안 유효합니다.</p>
      <p style="margin:24px 0;">
        <a href="${verifyUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          이메일 인증하기
        </a>
      </p>
      <p style="color:#888;font-size:12px;">본인이 가입하지 않았다면 이 메일을 무시해 주세요.</p>
    `,
  });
}
