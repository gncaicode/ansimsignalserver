import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: "7N74AP9H26.com.gncaitech.ansimSignal",
          paths: ["/ansimsignal_open*"],
        },
      ],
    },
  });
}
