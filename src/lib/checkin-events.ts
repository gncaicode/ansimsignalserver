import { EventEmitter } from 'events';

// Next.js 핫 리로드 시 모듈이 재실행되어도 동일 인스턴스를 유지
declare global {
  // eslint-disable-next-line no-var
  var __checkinEmitter: EventEmitter | undefined;
}

if (!globalThis.__checkinEmitter) {
  const e = new EventEmitter();
  e.setMaxListeners(200);
  globalThis.__checkinEmitter = e;
}

export const checkinEmitter = globalThis.__checkinEmitter!;
