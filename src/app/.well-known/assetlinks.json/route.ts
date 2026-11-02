import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.gncaitech.ansim_signal",
        sha256_cert_fingerprints: [
          "0C:1D:48:EA:1C:1D:4E:38:F0:95:8D:F4:C0:3A:E4:02:E2:F7:42:3F:0A:92:7F:04:38:44:B0:B6:2B:67:3D:70",
        ],
      },
    },
  ]);
}
