import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';

interface OrgRow extends RowDataPacket { org_id: number; }
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

    // 기관 조회 또는 생성
    let orgId: number;
    const orgResult = await query<OrgRow>(
      'SELECT org_id FROM organizations WHERE name = ?',
      [org]
    );
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].org_id;
    } else {
      const created = await execute(
        'INSERT INTO organizations (name) VALUES (?)',
        [org]
      );
      orgId = created.insertId;
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 12);

    // 관리자 등록
    await execute(
      `INSERT INTO admins
        (password_hash, name, organization_id, department, position, phone, email,
         role, agree_terms, agree_privacy, agree_marketing, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'superadmin', ?, ?, ?, CURDATE())`,
      [passwordHash, name, orgId, department, position, phone, email,
       agreeTerms ? 1 : 0, agreePrivacy ? 1 : 0, agreeMarketing ? 1 : 0]
    );

    return NextResponse.json({ message: '가입 신청이 완료되었습니다.' }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/auth/register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
