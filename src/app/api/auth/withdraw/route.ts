import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '인증 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }
    await execute('DELETE FROM users WHERE user_id = ?', [user.user_id]);
    return NextResponse.json({ message: '탈퇴가 완료되었습니다. 모든 데이터가 삭제되었습니다.' });
  } catch (err) {
    console.error('[DELETE /api/auth/withdraw]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
