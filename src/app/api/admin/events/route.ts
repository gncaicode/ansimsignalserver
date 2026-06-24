import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { checkinEmitter } from '@/lib/checkin-events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // 컨트롤러 이미 닫힘
        }
      };

      const onCheckin = () => send('checkin');
      checkinEmitter.on('checkin', onCheckin);

      // 연결 유지를 위한 30초 heartbeat (nginx 등 프록시 타임아웃 방지)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      cleanup = () => {
        clearInterval(heartbeat);
        checkinEmitter.off('checkin', onCheckin);
        try { controller.close(); } catch { /* 이미 닫힘 */ }
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  // 클라이언트 연결 종료 시 정리
  req.signal.addEventListener('abort', () => cleanup?.());

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // nginx 버퍼링 비활성화
    },
  });
}
