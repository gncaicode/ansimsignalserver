import { NextResponse } from "next/server";

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>안심시그널</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Malgun Gothic', sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
    }
    .icon img {
      width: 100%;
      height: 100%;
      border-radius: 22px;
    }
    h1 {
      font-size: 20px;
      color: #111;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .desc {
      font-size: 14px;
      color: #555;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .btn-store {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1E3A8A;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 12px;
      width: 100%;
    }
    .btn-store.ios {
      background: #111;
    }
    .btn-store svg {
      width: 20px;
      height: 20px;
      fill: white;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .btn-copy {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #1E3A8A;
      border: 2px solid #1E3A8A;
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 12px;
      width: 100%;
      cursor: pointer;
    }
    .notice {
      background: #E3F2FD;
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      color: #1E3A8A;
      line-height: 1.7;
      margin-top: 12px;
    }
    .notice strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .notice-kakao {
      background: #FFF9C4;
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      color: #795548;
      line-height: 1.8;
      margin-bottom: 16px;
    }
    .notice-kakao strong {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      color: #5D4037;
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <img src="/ansimsignal_open/ic_launcher.png" alt="안심시그널">
    </div>
    <h1>안심시그널</h1>
    <p class="desc">
      이 링크를 열려면 안심시그널 앱이 필요합니다.<br>
      아래 버튼을 눌러 앱을 설치해 주세요.
    </p>

    <!-- 카카오톡 안내 (카카오톡에서만 표시) -->
    <div id="kakao-notice" class="notice-kakao hidden">
      <strong>📌 Safari에서 열어주세요</strong>
      카카오톡에서는 앱을 바로 열 수 없습니다.<br>
      아래 버튼으로 URL을 복사한 후<br>
      Safari에 붙여넣기 하여 열어주세요.
    </div>

    <!-- URL 복사 버튼 (카카오톡에서만 표시) -->
    <button id="btn-copy" class="btn-copy hidden" onclick="copyUrl()">
      🔗 URL 복사하기
    </button>

    <!-- Android -->
    <a id="btn-android" class="btn-store hidden" href="https://play.google.com/store/apps/details?id=com.gncaitech.ansim_signal" target="_blank">
      <svg viewBox="0 0 24 24"><path d="M3.18 23.76c.3.17.65.19.96.07l12.45-7.2-2.78-2.78-10.63 9.91zM.59 1.06C.22 1.4 0 1.96 0 2.69v18.62c0 .73.22 1.29.59 1.63l.09.08 10.43-10.43v-.25L.68.98l-.09.08zM20.38 10.03l-2.78-1.61-3.11 3.11 3.11 3.11 2.81-1.62c.8-.46.8-1.22-.03-1.99zM4.14.24l12.45 7.2-2.78 2.78L3.18.31C3.49.19 3.84.21 4.14.38z"/></svg>
      Google Play에서 설치하기
    </a>

    <!-- iOS -->
    <a id="btn-ios" class="btn-store ios hidden" href="https://apps.apple.com/kr/app/안심시그널/id6785724887" target="_blank">
      <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      App Store에서 설치하기
    </a>

    <!-- PC: 둘 다 표시 -->
    <a id="btn-pc-android" class="btn-store hidden" href="https://play.google.com/store/apps/details?id=com.gncaitech.ansim_signal" target="_blank">
      <svg viewBox="0 0 24 24"><path d="M3.18 23.76c.3.17.65.19.96.07l12.45-7.2-2.78-2.78-10.63 9.91zM.59 1.06C.22 1.4 0 1.96 0 2.69v18.62c0 .73.22 1.29.59 1.63l.09.08 10.43-10.43v-.25L.68.98l-.09.08zM20.38 10.03l-2.78-1.61-3.11 3.11 3.11 3.11 2.81-1.62c.8-.46.8-1.22-.03-1.99zM4.14.24l12.45 7.2-2.78 2.78L3.18.31C3.49.19 3.84.21 4.14.38z"/></svg>
      Google Play에서 설치하기
    </a>
    <a id="btn-pc-ios" class="btn-store ios hidden" href="https://apps.apple.com/kr/app/안심시그널/id6785724887" target="_blank">
      <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      App Store에서 설치하기
    </a>

    <div class="notice">
      <strong>📌 설치 후 안내</strong>
      앱 설치가 완료되면 전달받은 링크를 다시 눌러주세요.<br>
      앱이 자동으로 실행됩니다.
    </div>
  </div>

  <script>
    var ua = navigator.userAgent;
    var isAndroid = /android/i.test(ua);
    var isIOS = /iphone|ipad|ipod/i.test(ua);
    var isKakao = /KAKAOTALK/i.test(ua);

    var params = new URLSearchParams(window.location.search);
    var code = params.get('code') || '';

    var playStoreUrl = 'https://play.google.com/store/apps/details?id=com.gncaitech.ansim_signal';

    var queryStr = code ? '?code=' + encodeURIComponent(code) : '';

    function copyUrl() {
      var url = 'https://assignal.net/ansimsignal_open' + queryStr;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() {
          document.getElementById('btn-copy').textContent = '✅ 복사 완료! Safari에 붙여넣기 하세요';
        });
      } else {
        var t = document.createElement('textarea');
        t.value = url;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        document.getElementById('btn-copy').textContent = '✅ 복사 완료! Safari에 붙여넣기 하세요';
      }
    }

    if (isAndroid) {
      document.getElementById('btn-android').classList.remove('hidden');

      var extraParams = code ? (';S.code=' + code) : '';
      var intentUrl = 'intent://assignal.net/ansimsignal_open' + queryStr +
        '#Intent' +
        ';scheme=https' +
        ';action=android.intent.action.VIEW' +
        ';category=android.intent.category.BROWSABLE' +
        ';package=com.gncaitech.ansim_signal' +
        extraParams +
        ';S.browser_fallback_url=' + encodeURIComponent(playStoreUrl) +
        ';end';

      window.location.href = intentUrl;

    } else if (isIOS) {
      var appStoreUrl = 'https://apps.apple.com/kr/app/안심시그널/id6785724887';

      if (isKakao) {
        // 카카오톡 인앱 브라우저: 안내 문구 + URL 복사 버튼 표시
        document.getElementById('kakao-notice').classList.remove('hidden');
        document.getElementById('btn-copy').classList.remove('hidden');
      } else {
        // 일반 Safari
        var iosBtn = document.getElementById('btn-ios');
        iosBtn.href = appStoreUrl;
        iosBtn.classList.remove('hidden');

        // 유니버설링크는 iOS가 자체적으로 처리한다(다른 앱에서 탭 시 자동 연결,
        // Safari 주소창 직접 진입 시 상단 배너 제공). 페이지가 스스로 같은 링크로
        // 재이동을 시도하거나 타이머로 자동 리다이렉트하면, 앱으로 전환된 뒤에도
        // Safari 쪽에 대기 중이던 네비게이션이 남아있다가 실행되어 앱 전환 직후
        // Safari가 다시 활성화되는 문제가 있었다. 그래서 자동 리다이렉트를 모두
        // 제거하고, 앱 미설치 시에는 사용자가 "App Store에서 설치하기" 버튼을
        // 직접 누르도록 안내만 한다.
      }

    } else {
      document.getElementById('btn-pc-android').classList.remove('hidden');
      document.getElementById('btn-pc-ios').classList.remove('hidden');
    }
  </script>
</body>
</html>
`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
