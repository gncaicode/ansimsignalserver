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
    text: `${userName}님이 위급 상태에 진입했습니다.\n\n위급 상태 진입 후 ${overdueText}가 경과했습니다.\n\n확인이 필요합니다.`,
    html: `
      <p><strong>${userName}</strong>님이 <strong>위급 상태</strong>에 진입했습니다.</p>
      <p>위급 상태 진입 후 <strong>${overdueText}</strong>가 경과했습니다.</p>
      <p>확인이 필요합니다.</p>
    `,
  });
}
