import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { issueEmailVerification } from '@/lib/email-verification';
import { TRIAL_USER_LIMIT } from '@/lib/org-plan';

interface EmailRow extends RowDataPacket { email: string; }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const org         = String(body.org        ?? '').trim();
    const department  = String(body.department ?? '').trim();
    const position    = String(body.position   ?? '').trim();
    const name        = String(body.name       ?? '').trim();
    const email       = String(body.email      ?? '').trim().toLowerCase();
    const phone       = String(body.phone      ?? '').trim();
    const password    = String(body.password   ?? '');
    const agreeTerms    = body.agree_terms    === true;
    const agreePrivacy  = body.agree_privacy  === true;
    const agreeMarketing = body.agree_marketing === true;
    const lang          = body.lang === 'ja' ? 'ja' : 'ko';

    // 필수 항목 검증
    if (!org || !department || !position || !name || !email || !phone || !password) {
      return NextResponse.json({ error: '모든 필수 항목을 입력해주세요.' }, { status: 400 });
    }
    if (!agreeTerms || !agreePrivacy) {
      return NextResponse.json({ error: '필수 약관에 동의해주세요.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
    }

    // 이메일 중복 확인
    const emailCheck = await query<EmailRow>(
      'SELECT email FROM admins WHERE email = ?',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    // 기관 신규 생성 (기관명이 같아도 가입할 때마다 별도 기관으로 등록)
    // 체험 기간은 이메일 인증을 마친 시점부터 계산한다.
    const created = await execute(
      "INSERT INTO organizations (name, plan_status, user_limit) VALUES (?, 'trial', ?)",
      [org, TRIAL_USER_LIMIT]
    );
    const orgId = created.insertId;

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 12);

    // 관리자 등록 (이메일 인증 전에는 로그인할 수 없다)
    const { insertId: adminId } = await execute(
      `INSERT INTO admins
        (password_hash, name, organization_id, department, position, phone, email,
         role, agree_terms, agree_privacy, agree_marketing, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'superadmin', ?, ?, ?, CURDATE())`,
      [passwordHash, name, orgId, department, position, phone, email,
       agreeTerms ? 1 : 0, agreePrivacy ? 1 : 0, agreeMarketing ? 1 : 0]
    );

    // 메일 발송이 실패해도 가입은 유지한다 — 로그인 화면에서 인증 메일을 다시 보낼 수 있다.
    try {
      await issueEmailVerification({ admin_id: adminId, name, email }, req.headers, lang);
    } catch (mailErr) {
      console.error('[POST /api/admin/auth/register] verification mail', mailErr);
    }

    return NextResponse.json({ message: '가입 신청이 완료되었습니다. 이메일 인증을 완료해 주세요.' }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/auth/register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
