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
  hoursOverdue: number
): Promise<void> {
  await transporter.sendMail({
    from: `"안심시그널" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[안심시그널] ${userName}님의 안부 신호가 없습니다`,
    text: `${userName}님이 ${hoursOverdue}시간째 안부 신호를 보내지 않았습니다.\n\n확인이 필요합니다.`,
    html: `
      <p><strong>${userName}</strong>님이 <strong>${hoursOverdue}시간</strong>째 안부 신호를 보내지 않았습니다.</p>
      <p>확인이 필요합니다.</p>
    `,
  });
}
